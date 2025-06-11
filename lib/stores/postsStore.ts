import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "./authStore";

export interface Post {
  id: string;
  title: string;
  content: string;
  status: "draft" | "used" | "archived";
  user_id: string;
  created_at: string;
  updated_at: string;
  posted_at?: string | null;
  content_type?: string;
  hashtags?: string[];
  performance?: {
    impressions?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

interface PostsState {
  posts: Post[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPosts: () => Promise<void>;
  createPost: (post: Partial<Post>) => Promise<Post>;
  updatePost: (id: string, updates: Partial<Post>) => Promise<Post>;
  deletePost: (id: string) => Promise<void>;

  // Internal
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  isLoading: false,
  error: null,

  fetchPosts: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      set({ error: "User not authenticated", isLoading: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({
        posts: data || [],
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching posts:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to fetch posts",
        isLoading: false,
      });
    }
  },

  createPost: async (post) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      set({ isLoading: true, error: null });
      const supabase = createClient();

      const newPost = {
        ...post,
        user_id: userId,
        status: post.status || "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("posts")
        .insert([newPost])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const currentPosts = get().posts;
      set({
        posts: [data, ...currentPosts],
        isLoading: false,
      });

      return data;
    } catch (error) {
      console.error("Error creating post:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to create post",
        isLoading: false,
      });
      throw error;
    }
  },

  updatePost: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });
      const supabase = createClient();

      const { data, error } = await supabase
        .from("posts")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      const currentPosts = get().posts;
      const updatedPosts = currentPosts.map((post) =>
        post.id === id ? data : post
      );

      set({
        posts: updatedPosts,
        isLoading: false,
      });

      return data;
    } catch (error) {
      console.error("Error updating post:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to update post",
        isLoading: false,
      });
      throw error;
    }
  },

  deletePost: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const supabase = createClient();

      const { error } = await supabase.from("posts").delete().eq("id", id);

      if (error) throw error;

      // Update local state
      const currentPosts = get().posts;
      const updatedPosts = currentPosts.filter((post) => post.id !== id);

      set({
        posts: updatedPosts,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to delete post",
        isLoading: false,
      });
      throw error;
    }
  },

  // State setters
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// Subscribe to auth state changes to clear posts when user logs out
if (typeof window !== "undefined") {
  let prevUserId: string | null = null;

  const unsubscribe = useAuthStore.subscribe((state) => {
    const currentUserId = state.user?.id || null;

    // If user changed (including logout), clear posts
    if (prevUserId !== currentUserId) {
      if (!currentUserId) {
        // User logged out, clear posts
        usePostsStore.setState({ posts: [], error: null });
      } else if (prevUserId && currentUserId !== prevUserId) {
        // Different user logged in, fetch new posts
        usePostsStore.getState().fetchPosts();
      }
      prevUserId = currentUserId;
    }
  });
}
