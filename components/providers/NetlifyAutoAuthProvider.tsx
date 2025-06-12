"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { netlifyAutoAuth } from "@/lib/auth/netlify-auto-auth";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  onboarding_completed: boolean;
}

interface NetlifyAuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasCompletedOnboarding: boolean;
  error: string | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  autoRedirect: () => string | null;
}

const NetlifyAuthContext = createContext<NetlifyAuthContextType | null>(null);

export function useNetlifyAutoAuth() {
  const context = useContext(NetlifyAuthContext);
  if (!context) {
    throw new Error(
      "useNetlifyAutoAuth must be used within NetlifyAutoAuthProvider"
    );
  }
  return context;
}

interface NetlifyAutoAuthProviderProps {
  children: React.ReactNode;
  showLoadingScreen?: boolean;
  enableAutoRedirect?: boolean;
}

export function NetlifyAutoAuthProvider({
  children,
  showLoadingScreen = true,
  enableAutoRedirect = true,
}: NetlifyAutoAuthProviderProps) {
  const [authState, setAuthState] = useState(() => netlifyAutoAuth.getState());
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const redirectExecuted = useRef(false);
  const initializationStarted = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleAutoRedirect = useCallback(
    (state: typeof authState) => {
      if (typeof window === "undefined" || redirectExecuted.current) return;

      const redirectPath = netlifyAutoAuth.autoRedirect();

      if (redirectPath) {
        console.log(
          `NetlifyAutoAuthProvider: Auto-redirecting to ${redirectPath}`
        );
        redirectExecuted.current = true;

        // Use replace to avoid back button issues
        router.replace(redirectPath);

        // Reset redirect flag after a delay to allow future redirects
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          redirectExecuted.current = false;
        }, 2000);
      }
    },
    [router]
  );

  useEffect(() => {
    // Prevent multiple initializations
    if (initializationStarted.current) return;
    initializationStarted.current = true;

    console.log("NetlifyAutoAuthProvider: Initializing...");

    // Subscribe to auth state changes with minimal debouncing
    let updateTimeout: NodeJS.Timeout;
    const unsubscribe = netlifyAutoAuth.subscribe((state) => {
      // Minimal debounce to prevent excessive re-renders
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        console.log("NetlifyAutoAuthProvider: Auth state updated:", {
          isAuthenticated: state.isAuthenticated,
          user: state.user?.email,
          isLoading: state.isLoading,
          error: state.error,
        });

        setAuthState(state);

        // Mark as initialized once we've completed the first auth check
        if (!state.isLoading && !isInitialized) {
          setIsInitialized(true);
          console.log("NetlifyAutoAuthProvider: Initialization completed");

          // Handle automatic redirects
          if (enableAutoRedirect && !redirectExecuted.current) {
            handleAutoRedirect(state);
          }
        }
      }, 10); // Reduced from 50ms to 10ms for faster response
    });

    // Start auth initialization with timeout
    const initTimeout = setTimeout(() => {
      console.warn(
        "NetlifyAutoAuthProvider: Initialization taking too long, forcing completion"
      );
      if (!isInitialized) {
        setIsInitialized(true);
      }
    }, 5000); // 5 second max timeout

    netlifyAutoAuth
      .initialize()
      .catch((error) => {
        console.error("NetlifyAutoAuthProvider: Initialization failed:", error);
      })
      .finally(() => {
        clearTimeout(initTimeout);
      });

    return () => {
      unsubscribe();
      initializationStarted.current = false;
      clearTimeout(updateTimeout);
      clearTimeout(initTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []); // Remove dependencies to prevent re-initialization

  // Manual redirect trigger
  const triggerAutoRedirect = useCallback(() => {
    if (!enableAutoRedirect) return null;

    const redirectPath = netlifyAutoAuth.autoRedirect();
    if (redirectPath) {
      router.push(redirectPath);
    }
    return redirectPath;
  }, [enableAutoRedirect, router]);

  const contextValue: NetlifyAuthContextType = {
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    isAdmin: authState.user?.is_admin ?? false,
    hasCompletedOnboarding: authState.user?.onboarding_completed ?? false,
    error: authState.error,
    login: async (email: string, password: string) => {
      const result = await netlifyAutoAuth.login(email, password);
      if (result.success && enableAutoRedirect) {
        // Immediate redirect without delay for better UX
        const redirectPath = netlifyAutoAuth.autoRedirect();
        if (redirectPath) {
          router.replace(redirectPath); // Use replace instead of push
        }
      }
      return result;
    },
    signup: async (email: string, password: string) => {
      const result = await netlifyAutoAuth.signup(email, password);
      if (result.success && enableAutoRedirect) {
        // Immediate redirect without delay for better UX
        const redirectPath = netlifyAutoAuth.autoRedirect();
        if (redirectPath) {
          router.replace(redirectPath); // Use replace instead of push
        }
      }
      return result;
    },
    logout: async () => {
      await netlifyAutoAuth.logout();
      // Force navigation to ensure logout redirect works
      window.location.href = "/login";
    },
    refresh: async () => {
      await netlifyAutoAuth.refresh();
    },
    autoRedirect: triggerAutoRedirect,
  };

  // Show loading screen during initial auth check
  if (showLoadingScreen && !isInitialized && authState.isLoading) {
    // Add timeout to prevent infinite loading
    setTimeout(() => {
      if (!isInitialized) {
        console.warn(
          "NetlifyAutoAuthProvider: Force completing initialization due to timeout"
        );
        setIsInitialized(true);
      }
    }, 6000); // 6 second timeout for loading screen

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <div className="mt-4 space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Loading Mylance
            </h2>
            <p className="text-sm text-gray-600">
              Authenticating your session...
            </p>
            {process.env.NODE_ENV === "development" && authState.error && (
              <p className="text-xs text-red-600 mt-2">
                Debug: {authState.error}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <NetlifyAuthContext.Provider value={contextValue}>
      {children}
    </NetlifyAuthContext.Provider>
  );
}
