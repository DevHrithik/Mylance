"use client";

import { useState, useEffect, useRef } from "react";
import { simpleAuth } from "@/lib/auth/simple-auth";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  onboarding_completed: boolean;
}

interface UseSimpleAuthReturn {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  hasCompletedOnboarding: boolean;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSimpleAuth(): UseSimpleAuthReturn {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const mounted = useRef(true);

  const fetchUser = async () => {
    if (!mounted.current) return;

    try {
      setIsLoading(true);

      // Check authentication first
      const authStatus = await simpleAuth.isAuthenticated();
      if (!mounted.current) return;

      setIsAuthenticated(authStatus);

      if (authStatus) {
        const userData = await simpleAuth.getUserData();
        if (!mounted.current) return;

        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.warn("Error fetching user:", error);
      if (!mounted.current) return;

      setUser(null);
      setIsAuthenticated(false);
    } finally {
      if (mounted.current) {
        setIsLoading(false);
      }
    }
  };

  const refetch = async () => {
    simpleAuth.clearCache();
    await fetchUser();
  };

  const logout = async () => {
    await simpleAuth.logout();
  };

  useEffect(() => {
    mounted.current = true;
    fetchUser();

    return () => {
      mounted.current = false;
    };
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin: user?.is_admin ?? false,
    hasCompletedOnboarding: user?.onboarding_completed ?? false,
    logout,
    refetch,
  };
}
