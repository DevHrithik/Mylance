"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Eye,
  Edit,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  User,
  Crown,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserDetailModal from "./UserDetailModal";

interface UserWithDetails {
  id: string;
  email: string;
  first_name?: string | null;
  linkedin_url?: string | null;
  business_type?: string | null;
  business_size?: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
  subscriptions?: {
    plan_type: "free" | "starter" | "professional" | "enterprise";
    status: "active" | "canceled" | "past_due" | "paused";
    current_period_end?: string | null;
  }[];
  post_count?: number;
}

interface UserTableProps {
  users: UserWithDetails[];
  totalCount: number;
  page: number;
  per_page: number;
  totalPages: number;
}

export default function UserTable({
  users,
  totalCount,
  page,
  per_page,
  totalPages,
}: UserTableProps) {
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(
    null
  );

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case "free":
        return "bg-gray-100 text-gray-800";
      case "starter":
        return "bg-blue-100 text-blue-800";
      case "professional":
        return "bg-purple-100 text-purple-800";
      case "enterprise":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "canceled":
        return "bg-red-100 text-red-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      case "paused":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (firstName?: string | null, email?: string) => {
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || "U";
  };

  const formatUserName = (user: UserWithDetails) => {
    return user.first_name || user.email.split("@")[0];
  };

  // Pagination calculations
  const startIndex = (page - 1) * per_page + 1;
  const endIndex = Math.min(page * per_page, totalCount);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Users</h3>
          <div className="text-sm text-gray-500">
            Showing {startIndex}-{endIndex} of {totalCount} users
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Posts</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const subscription = user.subscriptions?.[0];
              const planType = subscription?.plan_type || "free";
              const status = subscription?.status || "active";

              return (
                <TableRow key={user.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {getInitials(user.first_name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatUserName(user)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        {user.business_type && (
                          <div className="text-xs text-gray-400">
                            {user.business_type}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="secondary"
                        className={getPlanBadgeColor(planType)}
                      >
                        {planType === "free" && (
                          <User className="h-3 w-3 mr-1" />
                        )}
                        {planType !== "free" && (
                          <Crown className="h-3 w-3 mr-1" />
                        )}
                        {planType.charAt(0).toUpperCase() + planType.slice(1)}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant="secondary"
                        className={getStatusBadgeColor(status)}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                      {!user.onboarding_completed && (
                        <div className="flex items-center text-xs text-yellow-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Onboarding
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center text-sm text-gray-900">
                      <FileText className="h-4 w-4 mr-1 text-gray-400" />
                      {user.post_count || 0}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-gray-900">
                      {formatDistanceToNow(new Date(user.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {user.last_login_at
                        ? formatDistanceToNow(new Date(user.last_login_at), {
                            addSuffix: true,
                          })
                        : "Never"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}/prompts`}>
                            <FileText className="h-4 w-4 mr-2" />
                            Manage Prompts
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-blue-600">
                          <User className="h-4 w-4 mr-2" />
                          Impersonate User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No users found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {startIndex}-{endIndex} of {totalCount} users
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled={page === 1} asChild>
                <Link href={`?page=${page - 1}`}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Link>
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      asChild
                    >
                      <Link href={`?page=${pageNum}`}>{pageNum}</Link>
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <Button
                      variant={page === totalPages ? "default" : "outline"}
                      size="sm"
                      asChild
                    >
                      <Link href={`?page=${totalPages}`}>{totalPages}</Link>
                    </Button>
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                asChild
              >
                <Link href={`?page=${page + 1}`}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
