"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, FileText, TrendingUp, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

interface QuickActionsProps {
  className?: string;
}

const actions = [
  {
    title: "Create New Post",
    description: "Generate AI-powered LinkedIn content",
    icon: PenTool,
    href: ROUTES.POSTS_CREATE,
    variant: "default" as const,
    className:
      "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0",
  },
  {
    title: "View All Posts",
    description: "Manage your content library",
    icon: FileText,
    href: ROUTES.POSTS,
    variant: "outline" as const,
    className: "border-gray-200 hover:bg-gray-50",
  },
  {
    title: "Analytics",
    description: "Track your performance",
    icon: TrendingUp,
    href: ROUTES.ANALYTICS,
    variant: "outline" as const,
    className: "border-gray-200 hover:bg-gray-50",
  },
  {
    title: "AI Insights",
    description: "See what's working",
    icon: Sparkles,
    href: "/insights", // Will be added later
    variant: "outline" as const,
    className: "border-gray-200 hover:bg-gray-50",
  },
];

export function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter();

  const handleAction = (href: string) => {
    router.push(href);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant={action.variant}
              className={`h-auto p-4 flex items-center justify-start gap-3 text-left ${action.className}`}
              onClick={() => handleAction(action.href)}
            >
              <action.icon className="h-5 w-5 flex-shrink-0" />
              <div className="flex flex-col items-start min-w-0">
                <span className="font-medium text-sm">{action.title}</span>
                <span className="text-xs opacity-80 truncate w-full">
                  {action.description}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
