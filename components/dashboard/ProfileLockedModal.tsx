"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  ExternalLink,
  LogOut,
  Lock,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface ProfileLockedModalProps {
  open: boolean;
  onProfileUnlocked: () => void;
}

export function ProfileLockedModal({
  open,
  onProfileUnlocked,
}: ProfileLockedModalProps) {
  const [isBookingComplete, setIsBookingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const calendlyUrl =
    "https://calendly.com/bradley-33/mylance-content-onboarding";
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Listen for Calendly events
    const handleCalendlyEvent = (e: MessageEvent) => {
      if (e.data.event && e.data.event.indexOf("calendly") === 0) {
        if (e.data.event === "calendly.event_scheduled") {
          setIsBookingComplete(true);
        }
      }
    };

    window.addEventListener("message", handleCalendlyEvent);
    return () => window.removeEventListener("message", handleCalendlyEvent);
  }, []);

  const handleUnlockProfile = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Unlock the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          profile_locked: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile unlock error:", profileError);
        toast.error("Failed to unlock profile");
        return;
      }

      toast.success("Profile unlocked! Welcome to Mylance!");
      onProfileUnlocked();
    } catch (err: any) {
      console.error("Profile unlock error:", err);
      toast.error("Failed to unlock profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlreadyBookedCall = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Unlock the profile and mark onboarding as completed
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          profile_locked: false,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Profile unlock error:", profileError);
        toast.error("Failed to unlock profile");
        return;
      }

      toast.success("Welcome to Mylance! Your profile has been unlocked.");
      onProfileUnlocked();
    } catch (err: any) {
      console.error("Profile unlock error:", err);
      toast.error("Failed to unlock profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear all Supabase-related data from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("sb-") ||
          key.includes("supabase") ||
          key.includes("auth-token") ||
          key.includes("refresh-token") ||
          key.includes("access-token")
        ) {
          localStorage.removeItem(key);
        }
      });

      // Clear all Supabase-related data from sessionStorage
      Object.keys(sessionStorage).forEach((key) => {
        if (
          key.startsWith("sb-") ||
          key.includes("supabase") ||
          key.includes("auth-token") ||
          key.includes("refresh-token") ||
          key.includes("access-token")
        ) {
          sessionStorage.removeItem(key);
        }
      });

      // Use hard redirect to guarantee clean state and prevent redirect loops
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      setIsLoading(false);

      // Fallback: still try to redirect even if signOut failed
      setTimeout(() => {
        window.location.replace("/login");
      }, 1000);
    }
  };

  const handleOpenCalendly = () => {
    window.open(
      calendlyUrl,
      "_blank",
      "width=800,height=700,scrollbars=yes,resizable=yes"
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="min-w-3/4 h-[85vh] p-0 border-0 [&>button]:hidden">
        <DialogTitle className="sr-only">
          Complete Your Onboarding - Profile Access Required
        </DialogTitle>

        <div className=" max-w-8xl h-[85vh] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-br from-blue-600 to-teal-600 p-4 text-white flex-shrink-0">
            <div className="flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 mr-2" />
              <h1 className="text-xl font-bold">Complete Your Onboarding</h1>
            </div>
            <p className="text-center text-blue-100 text-xs">
              Book your strategy call to unlock full access to Mylance
            </p>
          </div>

          {/* Main Content - Two Column Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column - Content & Actions */}
            <div className="w-2/5 p-4 flex flex-col justify-between border-r border-gray-200">
              <div className="space-y-4">
                {/* Strategy Call Details */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center mb-2">
                      <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                      <CardTitle className="text-lg">
                        Strategy Call Details
                      </CardTitle>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">30 minutes</span>
                      </div>
                      <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                        <Video className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Video Call</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">
                        What we&apos;ll cover:
                      </h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Analyze your current LinkedIn presence</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Define your content pillars and messaging</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Create a personalized content strategy</span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span>Set up your Mylance workflow</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* Booking Status */}
                {isBookingComplete && (
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Booking Confirmed! 🎉
                      </h3>
                      <p className="text-sm text-green-700 mb-3">
                        Your onboarding call has been scheduled successfully.
                      </p>
                      <Button
                        onClick={handleUnlockProfile}
                        disabled={isLoading}
                        className="bg-gradient-to-br from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 w-full py-2"
                      >
                        {isLoading ? "Unlocking..." : "Access Dashboard"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="space-y-3 pt-3 border-t border-gray-200">
                {!isBookingComplete && (
                  <div className="space-y-2">
                    <Button
                      onClick={handleOpenCalendly}
                      className="w-full bg-gradient-to-br from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 py-2"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Booking in New Window
                    </Button>

                    <Button
                      onClick={handleAlreadyBookedCall}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full border-green-300 text-green-700 hover:bg-green-50 py-2"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {isLoading ? "Processing..." : "I Already Booked a Call"}
                    </Button>
                  </div>
                )}

                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Need to use a different account?
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50 py-2"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isLoading ? "Logging out..." : "Logout"}
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Need help? Email us at help@mylance.com
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Calendly Booking */}
            <div className="w-3/5 bg-gray-50">
              <div className="p-4 h-full">
                <div className="bg-white rounded-lg shadow-sm h-full overflow-hidden border border-gray-200">
                  <iframe
                    src={calendlyUrl}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    title="Schedule your onboarding call"
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
