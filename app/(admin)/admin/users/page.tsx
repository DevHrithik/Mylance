"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  AlertCircle,
  Clock,
  Users,
  UserCheck,
  UserX,
  Search,
  X,
  Loader2,
} from "lucide-react";

interface UserWithStats {
  id: string;
  email: string;
  first_name: string | null;
  full_name: string | null;
  created_at: string;
  onboarding_completed: boolean;
  is_admin: boolean;
  last_login_at: string | null;
  plan_type: string | null;
  subscription_status: string | null;
  total_posts: number;
  onboarding_progress?: {
    current_step: number;
    total_steps: number;
    updated_at: string;
    data: any;
  } | null;
}

type FilterType = "all" | "complete" | "incomplete" | "admins";

// Cache for user data
let cachedUsers: UserWithStats[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const hasInitialized = useRef(false);

  const fetchUsers = async (forceRefresh = false) => {
    const supabase = createClient();

    try {
      // Check if we have valid cached data and don't force refresh
      if (
        !forceRefresh &&
        cachedUsers &&
        cacheTimestamp &&
        Date.now() - cacheTimestamp < CACHE_DURATION
      ) {
        setUsers(cachedUsers);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Get all users
      const { data: profiles, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) {
        console.error("Users query error:", usersError);
        return;
      }

      // Get subscription data
      const userIds = profiles?.map((u) => u.id) || [];

      // Parallel queries for better performance
      const [subscriptionsResult, postCountsResult, onboardingProgressResult] =
        await Promise.all([
          supabase
            .from("subscriptions")
            .select("user_id, plan_type, status")
            .in("user_id", userIds),
          supabase.from("posts").select("user_id").in("user_id", userIds),
          supabase
            .from("onboarding_progress")
            .select("user_id, current_step, data, updated_at")
            .in("user_id", userIds),
        ]);

      const { data: subscriptions } = subscriptionsResult;
      const { data: postCounts } = postCountsResult;
      const { data: onboardingProgress } = onboardingProgressResult;

      // Combine the data
      const combinedUsers =
        profiles?.map((user) => {
          const subscription = subscriptions?.find(
            (s) => s.user_id === user.id
          );
          const userPostCount =
            postCounts?.filter((p) => p.user_id === user.id).length || 0;
          const progress = onboardingProgress?.find(
            (p) => p.user_id === user.id
          );

          return {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            full_name: user.full_name,
            created_at: user.created_at,
            onboarding_completed: user.onboarding_completed,
            is_admin: user.is_admin,
            last_login_at: user.last_login_at,
            plan_type: subscription?.plan_type || null,
            subscription_status: subscription?.status || null,
            total_posts: userPostCount,
            onboarding_progress: progress
              ? {
                  current_step: progress.current_step,
                  total_steps: 17, // Total steps in onboarding
                  updated_at: progress.updated_at,
                  data: progress.data,
                }
              : null,
          };
        }) || [];

      // Cache the data
      cachedUsers = combinedUsers;
      cacheTimestamp = Date.now();

      setUsers(combinedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasInitialized.current) {
      fetchUsers();
      hasInitialized.current = true;
    }
  }, []);

  // Refresh data when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && hasInitialized.current) {
        // Only refresh if cache is older than 2 minutes when coming back
        if (!cacheTimestamp || Date.now() - cacheTimestamp > 2 * 60 * 1000) {
          fetchUsers();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.first_name?.toLowerCase().includes(query) ||
          user.full_name?.toLowerCase().includes(query)
      );
    }

    // Apply filter type
    switch (filterType) {
      case "complete":
        filtered = filtered.filter(
          (u) => u.onboarding_completed && !u.is_admin
        );
        break;
      case "incomplete":
        filtered = filtered.filter(
          (u) => !u.onboarding_completed && !u.is_admin
        );
        break;
      case "admins":
        filtered = filtered.filter((u) => u.is_admin);
        break;
      case "all":
      default:
        // No additional filtering needed
        break;
    }

    return filtered;
  }, [users, searchQuery, filterType]);

  const getStatusBadge = (user: UserWithStats) => {
    if (user.is_admin) {
      return <Badge variant="destructive">Admin</Badge>;
    }
    if (user.subscription_status === "active") {
      return <Badge variant="default">{user.plan_type || "Active"}</Badge>;
    }
    if (user.onboarding_completed) {
      return <Badge variant="secondary">Free</Badge>;
    }
    return <Badge variant="outline">Incomplete</Badge>;
  };

  const getOnboardingProgress = (user: UserWithStats) => {
    if (user.onboarding_completed) {
      return {
        percentage: 100,
        text: "Completed",
        color: "bg-green-500",
      };
    }

    if (user.onboarding_progress) {
      const percentage = Math.round(
        (user.onboarding_progress.current_step /
          user.onboarding_progress.total_steps) *
          100
      );
      return {
        percentage,
        text: `Step ${user.onboarding_progress.current_step} of ${user.onboarding_progress.total_steps}`,
        color: percentage > 50 ? "bg-yellow-500" : "bg-red-500",
      };
    }

    return {
      percentage: 0,
      text: "Not started",
      color: "bg-gray-400",
    };
  };

  // Get counts for stats cards and filter display
  const allUsersCount = users.length;
  const completeUsersCount = users.filter(
    (u) => u.onboarding_completed && !u.is_admin
  ).length;
  const incompleteUsersCount = users.filter(
    (u) => !u.onboarding_completed && !u.is_admin
  ).length;
  const adminUsersCount = users.filter((u) => u.is_admin).length;

  // Sort incomplete users by progress (most progress first) if showing incomplete
  const displayUsers =
    filterType === "incomplete"
      ? [...filteredUsers].sort((a, b) => {
          const aProgress = a.onboarding_progress?.current_step || 0;
          const bProgress = b.onboarding_progress?.current_step || 0;
          return bProgress - aProgress;
        })
      : filteredUsers;

  const UserCard = ({ user }: { user: UserWithStats }) => {
    const progress = getOnboardingProgress(user);

    return (
      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-medium">
              {user.full_name || user.first_name || "Unknown User"}
            </h3>
            {getStatusBadge(user)}
            {!user.onboarding_completed && user.onboarding_progress && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {progress.text}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{user.email}</p>

          {/* Smaller Onboarding Progress Bar */}
          {!user.onboarding_completed && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Onboarding Progress</span>
                <span className="font-medium">{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="h-1" />
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              Joined:{" "}
              {formatDistanceToNow(new Date(user.created_at), {
                addSuffix: true,
              })}
            </span>
            <span>Posts: {user.total_posts}</span>
            {user.last_login_at && (
              <span>
                Last login:{" "}
                {formatDistanceToNow(new Date(user.last_login_at), {
                  addSuffix: true,
                })}
              </span>
            )}
            {user.onboarding_progress && (
              <span className="text-orange-600 font-medium">
                Last updated:{" "}
                {formatDistanceToNow(
                  new Date(user.onboarding_progress.updated_at),
                  {
                    addSuffix: true,
                  }
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/users/${user.id}`}>View Details</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/admin/users/${user.id}/edit`}>Edit Profile</Link>
          </Button>
        </div>
      </div>
    );
  };

  const UserCardSkeleton = () => (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-64 mb-2" />
        <div className="mb-2">
          <Skeleton className="h-3 w-32 mb-1" />
          <Skeleton className="h-1 w-full" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );

  const getPageTitle = () => {
    switch (filterType) {
      case "complete":
        return "Completed Onboarding Users";
      case "incomplete":
        return "Incomplete Onboarding Users";
      case "admins":
        return "Admin Users";
      default:
        return "All Users";
    }
  };

  const getPageDescription = () => {
    switch (filterType) {
      case "complete":
        return "Users who have successfully completed the onboarding process.";
      case "incomplete":
        return "Users who started but didn't complete onboarding. Sorted by progress (most progress first).";
      case "admins":
        return "Administrative users with elevated permissions.";
      default:
        return "All users in the system.";
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Users Management
            </h1>
            <p className="text-gray-600">
              Manage and edit user profiles, ICP data, and content strategy
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading users...
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search Bar Skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-1/4" />
        </div>

        {/* Users List Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <UserCardSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">
            Manage and edit user profiles, ICP data, and content strategy
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Total Users: {allUsersCount} | Showing: {filteredUsers.length}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(true)}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              Onboarding Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completeUsersCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              Incomplete Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {incompleteUsersCount}
            </div>
            {incompleteUsersCount > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {
                  users.filter(
                    (u) =>
                      !u.onboarding_completed &&
                      !u.is_admin &&
                      u.onboarding_progress
                  ).length
                }{" "}
                in progress
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-600" />
              Admin Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {adminUsersCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar and Filter Dropdown */}
      <div className="flex items-center gap-4">
        <div className="relative w-3/4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="w-1/4">
          <Select
            value={filterType}
            onValueChange={(value: FilterType) => setFilterType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="admins">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {filterType === "complete" && (
              <UserCheck className="h-5 w-5 text-green-600" />
            )}
            {filterType === "incomplete" && (
              <AlertCircle className="h-5 w-5 text-orange-600" />
            )}
            {filterType === "admins" && (
              <UserX className="h-5 w-5 text-red-600" />
            )}
            {filterType === "all" && <Users className="h-5 w-5" />}
            {getPageTitle()}
          </CardTitle>
          <p className="text-sm text-gray-600">{getPageDescription()}</p>
        </CardHeader>
        <CardContent>
          {displayUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? `No users match your search "${searchQuery}".`
                : filterType === "complete"
                ? "No users have completed onboarding yet."
                : filterType === "incomplete"
                ? "🎉 All users have completed onboarding!"
                : filterType === "admins"
                ? "No admin users found."
                : "No users found. Check your database connection."}
            </div>
          ) : (
            <div className="space-y-4">
              {displayUsers.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
