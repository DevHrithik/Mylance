import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./useAuth";

interface ProfileLockStatus {
  isLocked: boolean | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useProfileLock(): ProfileLockStatus {
  const [isLocked, setIsLocked] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchProfileLockStatus = async () => {
    if (!user) {
      setIsLocked(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("profile_locked")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile lock status:", error);
        setIsLocked(null);
        return;
      }

      setIsLocked(data.profile_locked || false);
    } catch (error) {
      console.error("Error in useProfileLock:", error);
      setIsLocked(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileLockStatus();
  }, [user]);

  return {
    isLocked,
    isLoading,
    refetch: fetchProfileLockStatus,
  };
}
