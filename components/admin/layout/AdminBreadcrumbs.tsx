"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function AdminBreadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split("/").filter(Boolean);

  // Remove 'admin' from the segments and create breadcrumb items
  const adminIndex = pathSegments.indexOf("admin");
  const breadcrumbSegments = pathSegments.slice(adminIndex + 1);

  const breadcrumbs = [
    { name: "Admin", href: "/admin", current: pathname === "/admin" },
  ];

  // Build breadcrumb path
  let currentPath = "/admin";
  breadcrumbSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === breadcrumbSegments.length - 1;

    // Format segment name (capitalize and handle special cases)
    let name = segment.charAt(0).toUpperCase() + segment.slice(1);
    if (segment === "users") name = "Users";
    if (segment === "prompts") name = "Prompts";
    if (segment === "analytics") name = "Analytics";
    if (segment === "feedback") name = "Feedback";
    if (segment === "settings") name = "Settings";

    breadcrumbs.push({
      name,
      href: currentPath,
      current: isLast,
    });
  });

  // Don't show breadcrumbs if we're on the main admin page
  if (pathname === "/admin") {
    return null;
  }

  return (
    <nav className="flex items-center px-6 py-3 bg-gray-50 border-b border-gray-200 lg:px-8">
      <div className="flex items-center space-x-2">
        <Home className="w-4 h-4 text-gray-400" />

        {breadcrumbs.map((breadcrumb, index) => (
          <div key={breadcrumb.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
            )}

            {breadcrumb.current ? (
              <span className="text-sm font-medium text-gray-900">
                {breadcrumb.name}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {breadcrumb.name}
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
