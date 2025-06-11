import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/stores/authStore";
import { usePostsStore } from "@/lib/stores/postsStore";

/**
 * Custom hook for auth state and operations
 */
export function useAuth() {
  const { user, profile, loading, signIn, signUp, signInWithGoogle, signOut } =
    useAuthStore();

  return {
    user,
    profile,
    isLoading: loading,
    isAdmin: profile?.is_admin || false,
    hasCompletedOnboarding: profile?.onboarding_completed || false,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };
}

/**
 * Custom hook for posts data and operations
 */
export function usePosts() {
  // Add local loading state to prevent duplicate fetches
  const [localLoading, setLocalLoading] = useState(false);
  const {
    posts,
    isLoading: storeLoading,
    error,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
  } = usePostsStore();

  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  // Combined loading state
  const isLoading = storeLoading || localLoading;

  // Enhanced fetch function
  const fetchPostsWithState = useCallback(async () => {
    if (!user?.id || !isAuthenticated) return;

    try {
      setLocalLoading(true);
      await fetchPosts();
    } finally {
      setLocalLoading(false);
    }
  }, [user?.id, isAuthenticated, fetchPosts]);

  // Auto-fetch posts when auth state is ready and we have a user
  useEffect(() => {
    if (
      !authLoading &&
      user?.id &&
      posts.length === 0 &&
      !storeLoading &&
      !localLoading
    ) {
      fetchPostsWithState();
    }
  }, [
    user?.id,
    authLoading,
    posts.length,
    storeLoading,
    localLoading,
    fetchPostsWithState,
  ]);

  return {
    posts,
    isLoading,
    error,
    fetchPosts: fetchPostsWithState,
    createPost,
    updatePost,
    deletePost,
  };
}
