import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface FullProfile {
  id: string;
  first_name?: string;
  full_name?: string;
  profile_locked?: boolean;
  content_strategy?: string;
  ideal_target_client?: string;
  // Add more fields as needed from profiles table
}

const CACHE_KEY = (userId: string) => `full_profile_${userId}`;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useFullProfile(userId: string) {
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const cacheKey = CACHE_KEY(userId);

    // Check cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const { data: cachedProfile, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > CACHE_TTL;

        if (!isExpired) {
          setProfile(cachedProfile);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.log("Cache parse error:", e);
        localStorage.removeItem(cacheKey);
      }
    }

    // Fetch fresh data
    const fetchProfile = async () => {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from("profiles")
          .select(
            "id, first_name, full_name, profile_locked, content_strategy, ideal_target_client"
          )
          .eq("id", userId)
          .single();

        if (error) {
          throw new Error(`Failed to fetch profile: ${error.message}`);
        }

        setProfile(data);

        // Cache the result
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );

        setError(null);
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch profile"
        );
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
}
