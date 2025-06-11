"use client";

import { useState, useCallback } from "react";
import type { DashboardData } from "@/lib/supabase/server-queries";

interface UseOptimizedDashboardReturn {
  data: DashboardData;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateOptimistically: (updates: Partial<DashboardData>) => void;
}

export function useOptimizedDashboard(
  initialData: DashboardData,
  userId: string
): UseOptimizedDashboardReturn {
  const [data, setData] = useState<DashboardData>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/refresh?userId=${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const freshData = await response.json();
      setData(freshData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to refresh";
      setError(message);
      console.error("Dashboard refresh error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Optimistic updates for immediate UI feedback
  const updateOptimistically = useCallback(
    (updates: Partial<DashboardData>) => {
      setData((prev) => ({
        ...prev,
        ...updates,
        stats: { ...prev.stats, ...(updates.stats || {}) },
        userPreferences: {
          ...prev.userPreferences,
          ...(updates.userPreferences || {}),
        },
      }));
    },
    []
  );

  return {
    data,
    isLoading,
    error,
    refresh,
    updateOptimistically,
  };
}
