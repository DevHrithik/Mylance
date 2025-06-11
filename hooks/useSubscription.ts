import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Subscription {
  id: number;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan_type: "free" | "monthly";
  status: "active" | "canceled" | "past_due" | "paused";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionStatus {
  hasAccess: boolean;
  isAdmin: boolean;
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
}

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasAccess: false,
    isAdmin: false,
    subscription: null,
    loading: true,
    error: null,
  });

  const router = useRouter();

  const checkSubscriptionStatus = async () => {
    try {
      setStatus((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/stripe/subscription-status");

      if (!response.ok) {
        // Log the actual response for debugging
        const text = await response.text();
        console.error("Subscription status error response:", {
          status: response.status,
          statusText: response.statusText,
          body: text,
        });

        // Try to parse as JSON, fallback to error message
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If it's not JSON, use the text as is
          errorMessage = text.includes("<!DOCTYPE")
            ? `Server returned HTML instead of JSON (${response.status})`
            : text || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      setStatus({
        hasAccess: data.hasAccess,
        isAdmin: data.isAdmin,
        subscription: data.subscription,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  };

  const createCheckoutSession = async () => {
    try {
      console.log("Creating checkout session...");
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Log the actual response for debugging
        const text = await response.text();
        console.error("Checkout session error response:", {
          status: response.status,
          statusText: response.statusText,
          body: text,
        });

        // Try to parse as JSON, fallback to error message
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If it's not JSON, use the text as is
          errorMessage = text.includes("<!DOCTYPE")
            ? `Server returned HTML instead of JSON (${response.status})`
            : text || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Checkout response:", response.status, data);

      if (data.url) {
        console.log("Redirecting to Stripe checkout:", data.url);
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received from server");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw error;
    }
  };

  const requireSubscription = () => {
    if (!status.loading && !status.hasAccess && !status.isAdmin) {
      router.push("/billing");
      return false;
    }
    return status.hasAccess || status.isAdmin;
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  return {
    ...status,
    createCheckoutSession,
    requireSubscription,
    refetch: checkSubscriptionStatus,
  };
}
