"use client";

import { useState, useEffect } from "react";
import { PromptLibrary } from "@/components/dashboard/PromptLibrary";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";

export default function PromptLibraryPage() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchPrompts = async () => {
    try {
      setLoading(true);

      // Get user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setLoading(false);
        return;
      }

      // Fetch prompts
      const { data: promptsData, error: promptsError } = await supabase
        .from("content_prompts")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (promptsError) {
        console.error("Prompts error:", promptsError);
        throw promptsError;
      }

      setPrompts(promptsData || []);
    } catch (err) {
      console.error("Error fetching prompts:", err);
      toast.error("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [supabase]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PromptLibrary
        prompts={prompts}
        onPromptsChange={fetchPrompts}
        activeView="library"
        onViewChange={() => {}}
      />
    </div>
  );
}
