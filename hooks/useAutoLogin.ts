"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { netlifyAutoAuth } from "@/lib/auth/netlify-auto-auth";

interface AutoLoginOptions {
  enableAutoRedirect?: boolean;
  redirectDelay?: number;
  onAuthStateChange?: (isAuthenticated: boolean, user: any) => void;
}

/**
 * Hook for handling auto-login functionality
 * This hook automatically checks for existing sessions and redirects users appropriately
 */
export function useAutoLogin(options: AutoLoginOptions = {}) {
  const {
    enableAutoRedirect = true,
    redirectDelay = 0,
    onAuthStateChange,
  } = options;

  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const handleAutoLogin = async () => {
      try {
        // Initialize auth system
        await netlifyAutoAuth.initialize();

        if (!mounted) return;

        const state = netlifyAutoAuth.getState();

        // Notify parent component of auth state change
        if (onAuthStateChange) {
          onAuthStateChange(state.isAuthenticated, state.user);
        }

        // Handle auto-redirect if enabled
        if (enableAutoRedirect && state.isAuthenticated) {
          const redirectPath = netlifyAutoAuth.autoRedirect();

          if (redirectPath) {
            console.log(`useAutoLogin: Auto-redirecting to ${redirectPath}`);

            if (redirectDelay > 0) {
              setTimeout(() => {
                if (mounted) {
                  router.push(redirectPath);
                }
              }, redirectDelay);
            } else {
              router.push(redirectPath);
            }
          }
        }
      } catch (error) {
        console.error("useAutoLogin: Error during auto-login:", error);
      }
    };

    handleAutoLogin();

    return () => {
      mounted = false;
    };
  }, [enableAutoRedirect, redirectDelay, onAuthStateChange, router]);

  // Return auth state and utility functions
  const state = netlifyAutoAuth.getState();

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isAdmin: state.user?.is_admin ?? false,
    hasCompletedOnboarding: state.user?.onboarding_completed ?? false,
    error: state.error,

    // Utility functions
    login: async (email: string, password: string) => {
      const result = await netlifyAutoAuth.login(email, password);

      if (result.success && enableAutoRedirect) {
        const redirectPath = netlifyAutoAuth.autoRedirect();
        if (redirectPath) {
          router.push(redirectPath);
        }
      }

      return result;
    },

    logout: async () => {
      await netlifyAutoAuth.logout();
      router.push("/login");
    },

    refresh: () => netlifyAutoAuth.refresh(),

    triggerAutoRedirect: () => {
      const redirectPath = netlifyAutoAuth.autoRedirect();
      if (redirectPath) {
        router.push(redirectPath);
      }
      return redirectPath;
    },
  };
}

/**
 * Simple hook that just checks if user should be redirected
 * Useful for page-level redirects
 */
export function useAutoRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        await netlifyAutoAuth.initialize();

        const redirectPath = netlifyAutoAuth.autoRedirect();
        if (redirectPath) {
          console.log(`useAutoRedirect: Redirecting to ${redirectPath}`);
          router.replace(redirectPath);
        }
      } catch (error) {
        console.error("useAutoRedirect: Error:", error);
      }
    };

    checkAndRedirect();
  }, [router]);
}

/**
 * Hook that provides auth state without any side effects
 * Useful when you just need to read the auth state
 */
export function useAuthState() {
  const state = netlifyAutoAuth.getState();

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isAdmin: state.user?.is_admin ?? false,
    hasCompletedOnboarding: state.user?.onboarding_completed ?? false,
    error: state.error,
  };
}
