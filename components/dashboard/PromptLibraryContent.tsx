"use client";

import { useState } from "react";
import { PromptLibrary } from "@/components/dashboard/PromptLibrary";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface PromptLibraryData {
  prompts: any[];
}

interface PromptLibraryContentProps {
  initialData: PromptLibraryData;
  userId: string;
}

export function PromptLibraryContent({
  initialData,
  userId,
}: PromptLibraryContentProps) {
  const [prompts, setPrompts] = useState<any[]>(initialData.prompts);

  const supabase = createClient();

  const fetchPrompts = async () => {
    try {
      // Fetch prompts
      const { data: promptsData, error: promptsError } = await supabase
        .from("content_prompts")
        .select("*")
        .eq("user_id", userId)
        .order("scheduled_date", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: false });

      if (promptsError) {
        console.error("Prompts error:", promptsError);
        throw promptsError;
      }

      setPrompts(promptsData || []);
    } catch (err) {
      console.error("Error fetching prompts:", err);
      toast.error("Failed to load prompts");
    }
  };

  return (
    <PromptLibrary
      prompts={prompts}
      onPromptsChange={fetchPrompts}
      activeView="library"
      onViewChange={() => {}}
    />
  );
}
