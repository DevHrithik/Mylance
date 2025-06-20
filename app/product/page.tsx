"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  Edit3,
  Calendar,
  TrendingUp,
  Loader2,
  AlertCircle,
  Info,
  Shield,
  ChevronDown,
  ChevronUp,
  Quote,
  Rocket,
} from "lucide-react";
import { STRIPE_CONFIG } from "@/lib/stripe/config";
import { useSubscription } from "@/hooks/useSubscription";
import { useRouter } from "next/navigation";

export default function ProductPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  const {
    createCheckoutSession,
    hasAccess,
    isAdmin,
    loading: subscriptionLoading,
  } = useSubscription();

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Starting checkout session creation...");

      await createCheckoutSession();

      setTimeout(() => {
        if (loading) {
          setLoading(false);
          setError(
            "Redirect to payment page is taking longer than expected. Please try again or contact support."
          );
        }
      }, 10000);
    } catch (error) {
      console.error("Error subscribing:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Unknown error occurred. Please try again or contact support."
      );
      setLoading(false);
    }
  };

  // No auto-redirect needed - Stripe handles the redirect to dashboard directly

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // Redirect admins to admin panel if they access product page directly
  if (isAdmin) {
    router.replace("/admin");
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Redirecting to admin panel...</p>
        </div>
      </div>
    );
  }

  // If user already has access, show them a button to go to dashboard
  if (hasAccess && !subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Welcome back!</h2>
          <p className="text-gray-600 mb-6">
            Your account is ready! Start creating content on your dashboard.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: Search,
      title: "Custom Strategy",
      description:
        "We define your niche, ideal client, and value prop — and learn your voice using your past posts.",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: Edit3,
      title: "Weekly Content Prompts",
      description:
        "Every Monday, you get 3 post prompts crafted in your voice, ready to copy, edit, or publish as-is.",
      bgColor: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      icon: Calendar,
      title: "Content Calendar",
      description:
        "Plan, edit, and track your posts in one simple dashboard that keeps you consistent.",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
    },
    {
      icon: TrendingUp,
      title: "Performance Insights",
      description:
        "We learn from what works and optimize future prompts to improve your results over time.",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const testimonials = [
    {
      text: "This gave me the confidence to post consistently for the first time — and I signed my a new client from LinkedIn last month!",
      author: "Taylor W.",
      role: "Fractional CMO",
    },
    {
      text: "I used to stare at a blank screen. Now I just open Monday's email and create with confidence and clarity. It takes me <10 minutes to write my posts for the week!",
      author: "Jason K.",
      role: "Founder",
    },
    {
      text: "It actually sounds like me. I didn't think a tool like this could do that.",
      author: "Priya S.",
      role: "Data Analytics Consultant",
    },
  ];

  const faqs = [
    {
      question: "What exactly am I getting with this?",
      answer:
        "You'll receive a personalized content strategy based on your niche, your ideal customer, and your unique value. Each week, we deliver a content calendar with three LinkedIn prompts (Monday, Wednesday, Friday), plus a recommended hook to kickstart each post. These are designed to help you resonate with the *right* audience, not just chase vanity metrics.",
    },
    {
      question: "How do you make sure the content sounds like me?",
      answer:
        "Our system builds a writing profile based on your voice — and learns over time. You can edit the post drafts to refine the tone, and your edits are saved so future drafts become even more aligned with your authentic style.",
    },
    {
      question:
        "I'm already posting on LinkedIn — how is this different from using AI or writing my own content?",
      answer:
        "Anyone can post with ChatGPT now, but most AI content sounds generic. We give you the *strategy* and *structure* to consistently post content that actually builds trust with the people you want to work with. You stay in control — we just give you the framework to win.",
    },
    {
      question:
        "What if I don't like being on video or don't have great photos?",
      answer:
        "That's totally fine. While visual content can help, it's not required to be successful. Our clients get traction with written posts that tell the right stories. You don't need polish — you need relevance.",
    },
    {
      question:
        "Can this help me land speaking gigs or raise my visibility as a thought leader?",
      answer:
        "Yes. By creating a consistent presence on LinkedIn and showcasing your expertise around clear content pillars, you become known for your perspective. Clients have landed podcasts, press features, and speaking invites simply by showing up every week with a strong voice.",
    },
    {
      question: "What if I serve multiple audiences or have different brands?",
      answer:
        "We help you focus. During onboarding, we ask who you're trying to attract *right now* and build a content strategy around that. You can always evolve it later — but clarity wins on LinkedIn.",
    },
    {
      question: "I'm busy and not super tech-savvy. Will this work for me?",
      answer:
        "Yes — that's who we built it for. You'll receive an email each week with three simple prompts and hooks. You can answer in writing or record a quick voice note to yourself. We keep it simple, focused, and easy to follow — like a personal trainer for your content.",
    },
    {
      question: "Is there a setup fee or long-term contract?",
      answer:
        "Nope. It's normally $279 / month but for a limited time, we're offering beta customers to join us at $139.50/month, month-to-month. No setup fee. No lock-in. Just an honest commitment to helping you show up with clarity, consistency, and confidence. In return, we'd love your detailed feedback to help us shape the product.",
    },
    {
      question: "How quickly do I start receiving content?",
      answer:
        "After you enroll, we schedule a 1:1 strategy call. Within a week of that call, you'll receive your first weekly content calendar. From there, you get a fresh set of prompts every week.",
    },
    {
      question: "What kind of results should I expect?",
      answer:
        "Our most successful users show up consistently, write to their ideal audience, and use the calendar to stay on track. You'll build trust, grow your visibility, and attract more of the *right* leads — the ones ready to buy.",
    },
    {
      question: "Can I talk to someone?",
      answer:
        'Yes! Book time with our team here to get your questions answered: <a href="https://calendly.com/bradley-33/linkedin-content-mvp-interest" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline font-semibold">Schedule a call</a>',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="w-full px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Turn LinkedIn into a{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-600">
              Lead Machine
            </span>{" "}
            — Without the Burnout
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            We will help you publish content that attracts clients and builds
            trust — in your voice, on your schedule.
          </p>
          <div className="mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-lg text-gray-500 line-through">
                $279/month
              </span>
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                50% OFF BETA
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              <p className="font-semibold text-orange-600 mb-2">
                ⚡ Limited Time Beta Pricing
              </p>
              <p>• Limited spaces available</p>
              <p>• Offer ends soon</p>
            </div>
          </div>
          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-xl hover:shadow-2xl transition-all"
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </div>
            ) : (
              `Get Started for $${STRIPE_CONFIG.PRICE}/month`
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-xl mx-auto mb-8 animate-slide-in">
            <Card className="border-red-200 bg-red-50 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-800 text-sm">
                      Payment Error
                    </h3>
                    <p className="text-xs text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Cancelled Message */}
        {paymentStatus === "cancelled" && (
          <div className="max-w-xl mx-auto mb-8 animate-slide-in">
            <Card className="border-orange-200 bg-orange-50 shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-orange-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-800 text-sm">
                      Payment Cancelled
                    </h3>
                    <p className="text-xs text-orange-700 mt-1">
                      No worries! You can complete your subscription whenever
                      you&apos;re ready.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* What You Get Section */}
        <div className="max-w-7xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Here is What You will Get Every Month
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm shadow-md hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300`}
                  >
                    <feature.icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Visual Demo Section */}
        <div className="max-w-6xl mx-auto mb-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            See It In Action
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Here is what your content engine looks like: easy-to-follow prompts,
            tailored to your voice, delivered every week.
          </p>
          <div className="bg-white rounded-xl p-4 shadow-2xl border border-gray-200">
            <img
              src="/dashboard.png"
              alt="Mylance Dashboard - Content Calendar and Prompts"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Real Users. Real Results.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="bg-white shadow-md hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <CardContent className="p-6">
                  <Quote className="h-6 w-6 text-blue-500 mb-4" />
                  <p className="text-gray-700 mb-4 italic leading-relaxed">
                    &quot;{testimonial.text}&quot;
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.author}
                      </p>
                      <p className="text-sm text-gray-600">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing & CTA Section */}
        <div className="max-w-4xl mx-auto mb-20 text-center">
          <Card className="bg-gradient-to-br from-blue-600 to-teal-600 border-0 shadow-xl">
            <CardContent className="p-10">
              <div className="text-white">
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-xl text-blue-200 line-through">
                      $279/month
                    </span>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      50% OFF BETA
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">
                    Start Today — ${STRIPE_CONFIG.PRICE}/month
                  </h2>
                  <div className="text-blue-100 mb-4 text-sm">
                    <p className="font-semibold text-yellow-300 mb-2">
                      ⚡ Limited Time Beta Pricing
                    </p>
                    <p>• Limited spaces available • Offer ends soon</p>
                  </div>
                </div>
                <p className="text-blue-100 mb-6 text-lg">
                  No contracts. Cancel anytime.
                </p>
                <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                  You will get: a custom strategy, weekly prompts in your voice,
                  performance insights, and ongoing support to help you win
                  clients.
                </p>

                <Button
                  onClick={handleSubscribe}
                  disabled={loading}
                  className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all mb-6"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    "Get Started Now"
                  )}
                </Button>

                <div className="space-y-2 text-blue-100">
                  <div className="flex items-center justify-center">
                    <Rocket className="h-4 w-4 mr-2" />
                    <span>First prompts delivered Monday.</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <Shield className="h-4 w-4 mr-2" />
                    <span>
                      30-day satisfaction guarantee — love it or get your money
                      back.
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Satisfaction Guarantee Section */}
        <div className="max-w-4xl mx-auto mb-20 text-center">
          <Card className="bg-green-50 border-green-200 shadow-md">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Our Satisfaction Guarantee
              </h2>
              <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto">
                We stand behind our work. If you are not satisfied with your
                content strategy or prompts within the first 30 days, just let
                us know — we will make it right or give you a full refund. No
                hoops, no hassle.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Still Have Questions?
            </h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="shadow-md">
                <CardContent className="p-0">
                  <button
                    onClick={() =>
                      setExpandedFaq(expandedFaq === index ? null : index)
                    }
                    className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {faq.question}
                      </h3>
                      {expandedFaq === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6">
                      <p
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-in {
          animation: slide-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
          animation-fill-mode: both;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
}
