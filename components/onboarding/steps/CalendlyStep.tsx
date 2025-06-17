"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

interface CalendlyStepProps {
  onNext: () => void;
  onSkip?: () => void;
  onAlreadyBooked?: () => void;
}

export function CalendlyStep({
  onNext,
  onSkip,
  onAlreadyBooked,
}: CalendlyStepProps) {
  const [isBookingComplete, setIsBookingComplete] = useState(false);
  const calendlyUrl =
    "https://calendly.com/bradley-33/mylance-content-onboarding";

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

  const handleContinue = () => {
    onNext();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onNext();
    }
  };

  const handleAlreadyBookedCall = () => {
    if (onAlreadyBooked) {
      onAlreadyBooked();
    } else {
      onNext();
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
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-yellow-400 rounded-full opacity-80 -translate-x-32 -translate-y-32"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full opacity-80 translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500 rounded-full opacity-80 -translate-x-32 translate-y-32"></div>

      <div className="relative z-10 max-w-2xl w-full">
        <div className="text-center mb-8">
          <span className="text-teal-600 text-xl font-medium">17 →</span>
          <h1 className="text-3xl font-normal text-gray-900 mt-4 mb-6">
            Let&apos;s Schedule Your Strategy Call
          </h1>
          <p className="text-gray-600 italic text-base mb-8">
            Book your personalized onboarding call to develop your LinkedIn
            content strategy
          </p>
        </div>

        <Card className="relative shadow-xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-6 w-6 text-blue-500 mr-2" />
              <CardTitle className="text-xl">
                Thought Leadership Onboarding Call
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium">30 minutes</span>
                </div>
                <div className="flex items-center justify-center space-x-2 p-3 bg-green-50 rounded-lg">
                  <Video className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium">Video Call</span>
                </div>
              </div>

              <div className="space-y-3 text-left">
                <h4 className="font-semibold text-sm">
                  What we&apos;ll cover in your call:
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Analyze your current LinkedIn presence
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Define your content pillars and messaging
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Create your personalized content strategy
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Set up your weekly content workflow
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">
                      Q&A and strategy refinement
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {isBookingComplete ? (
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Booking Confirmed! 🎉
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  Your onboarding call has been scheduled. You&apos;ll receive a
                  confirmation email with all the details.
                </p>
                <Button
                  onClick={handleContinue}
                  className="bg-gradient-to-br from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                >
                  Complete Onboarding
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Embedded Calendly iframe */}
                <div
                  className="border rounded-lg overflow-hidden bg-white"
                  style={{ height: "600px" }}
                >
                  <iframe
                    src={calendlyUrl}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    title="Schedule your onboarding call"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    onClick={handleOpenCalendly}
                    className="bg-gradient-to-br from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in New Window
                  </Button>

                  <Button
                    onClick={handleAlreadyBookedCall}
                    className="bg-gradient-to-br from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />I Already Booked My
                    Call
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="border-gray-300 hover:border-gray-400"
                  >
                    Book Later
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Email us at help@mylance.com
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-16 text-center">
          <h2 className="text-4xl font-light text-teal-600">Mylance</h2>
        </div>
      </div>
    </div>
  );
}
