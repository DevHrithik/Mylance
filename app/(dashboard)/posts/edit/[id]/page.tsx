"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface EditPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);

  useEffect(() => {
    // For now, redirect to create page
    // In the future, this could be a dedicated edit interface
    router.push(`/posts/create?edit=${resolvedParams.id}`);
  }, [resolvedParams.id, router]);

  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to editor...</p>
      </div>
    </div>
  );
}
