"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Copy, ExternalLink } from "lucide-react";

interface RecentPostsProps {
  className?: string;
}

// Mock data for now - in real app this would come from API
const recentPosts = [
  {
    id: "1",
    title:
      "The Future of Remote Work: Why Traditional Offices Are Becoming Obsolete",
    content:
      "Remote work isn't just a trend, it's a fundamental shift in how we think about productivity and work-life balance. After 3 years of helping companies transition...",
    status: "draft" as const,
    createdAt: "2 hours ago",
    contentType: "Thought Leadership",
  },
  {
    id: "2",
    title: "5 Lessons from My First Year as a Consultant",
    content:
      "When I started my consulting journey, I thought I knew what to expect. I was wrong in the best possible way. Here's what I learned...",
    status: "used" as const,
    createdAt: "1 day ago",
    contentType: "Personal Story",
    engagement: "12.5% engagement",
    linkedinUrl: "https://linkedin.com/posts/sample",
  },
  {
    id: "3",
    title: "Why Most Businesses Fail at Digital Transformation",
    content:
      "It's not about the technology. It never was. After helping 50+ companies with their digital transformation initiatives, I've seen the same pattern...",
    status: "draft" as const,
    createdAt: "3 days ago",
    contentType: "Industry Insight",
  },
];

const getStatusBadge = (status: "draft" | "used" | "archived") => {
  switch (status) {
    case "draft":
      return (
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-700 text-xs px-2 py-1"
        >
          Draft
        </Badge>
      );
    case "used":
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-700 text-xs px-2 py-1"
        >
          Posted
        </Badge>
      );
    case "archived":
      return (
        <Badge variant="outline" className="text-gray-500 text-xs px-2 py-1">
          Archived
        </Badge>
      );
    default:
      return null;
  }
};

export function RecentPosts({ className }: RecentPostsProps) {
  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: Add toast notification
  };

  const handleViewPost = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Recent Posts
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
        >
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentPosts.map((post) => (
          <div
            key={post.id}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Header with title and status */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm leading-5 line-clamp-2 mb-2">
                  {post.title}
                </h3>
                <div className="flex items-center gap-2">
                  {getStatusBadge(post.status)}
                  <span className="text-xs text-gray-500">
                    {post.contentType}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {post.status === "draft" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(post.content)}
                    className="h-8 w-8 p-0"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
                {post.linkedinUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewPost(post.linkedinUrl!)}
                    className="h-8 w-8 p-0"
                    title="View on LinkedIn"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content preview */}
            <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
              {post.content}
            </p>

            {/* Meta information */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{post.createdAt}</span>
              {post.engagement && (
                <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                  {post.engagement}
                </span>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
