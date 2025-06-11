import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  MessageSquare,
  FileText,
  Video,
  Mail,
  BookOpen,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help & Support | Mylance",
  description: "Get help and find answers to your questions",
};

export default function HelpPage() {
  const helpCategories = [
    {
      title: "Getting Started",
      description: "Learn the basics of using Mylance",
      icon: BookOpen,
      articles: [
        "Setting up your profile",
        "Creating your first post",
        "Understanding AI generations",
        "Connecting LinkedIn account",
      ],
    },
    {
      title: "Content Creation",
      description: "Master AI-powered content generation",
      icon: FileText,
      articles: [
        "Writing effective prompts",
        "Customizing content tone",
        "Using content pillars",
        "Editing generated content",
      ],
    },
    {
      title: "Analytics & Performance",
      description: "Track and improve your content performance",
      icon: Video,
      articles: [
        "Reading analytics dashboard",
        "Understanding engagement metrics",
        "AI learning and improvements",
        "Performance benchmarks",
      ],
    },
    {
      title: "Account & Billing",
      description: "Manage your account and subscription",
      icon: MessageSquare,
      articles: [
        "Subscription plans explained",
        "Upgrading your plan",
        "Managing payment methods",
        "Usage limits and tracking",
      ],
    },
  ];

  const quickActions = [
    {
      title: "Contact Support",
      description: "Get personalized help from our team",
      icon: Mail,
      href: "/help/contact",
      variant: "default" as const,
    },
    {
      title: "Video Tutorials",
      description: "Watch step-by-step guides",
      icon: Video,
      href: "/help/tutorials",
      variant: "outline" as const,
    },
    {
      title: "FAQ",
      description: "Find answers to common questions",
      icon: HelpCircle,
      href: "/help/faq",
      variant: "outline" as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            How can we help you?
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Find answers, tutorials, and get support for Mylance
          </p>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search for help articles..."
              className="pl-12 h-12 text-lg"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 text-center">
                  <action.icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {helpCategories.map((category) => (
            <Card
              key={category.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <category.icon className="h-6 w-6 text-blue-600" />
                  {category.title}
                </CardTitle>
                <p className="text-gray-600">{category.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {category.articles.map((article, index) => (
                    <li key={index}>
                      <Link
                        href={`/help/articles/${article
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm flex items-center gap-1"
                      >
                        {article}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Popular Articles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Popular Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "How to create engaging LinkedIn posts with AI",
                "Understanding your content performance metrics",
                "Best practices for LinkedIn content strategy",
                "Troubleshooting common AI generation issues",
                "Setting up your writing profile for better results",
                "Managing your subscription and billing",
              ].map((article, index) => (
                <Link
                  key={index}
                  href={`/help/articles/${article
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline text-sm flex items-center gap-2 p-2 rounded hover:bg-blue-50"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  {article}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Support CTA */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">
              Still need help?
            </h3>
            <p className="text-blue-700 mb-6">
              Our support team is here to help you get the most out of Mylance
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/help/contact">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </Link>
              <Link href="/help/tutorials">
                <Button
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Watch Tutorials
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
