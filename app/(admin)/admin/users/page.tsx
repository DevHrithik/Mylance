import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDistanceToNow } from "date-fns";

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
}

async function getUsers(): Promise<UserWithStats[]> {
  const supabase = await createClient();

  try {
    // Use a direct SQL query to get all user data with stats
    const { data, error } = await supabase.rpc("get_admin_users_data");

    if (error) {
      console.error("RPC error, falling back to manual query:", error);

      // Manual query as fallback
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (usersError) {
        console.error("Users query error:", usersError);
        return [];
      }

      // Get subscription data separately
      const userIds = users?.map((u) => u.id) || [];
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("user_id, plan_type, status")
        .in("user_id", userIds);

      // Get post counts separately
      const { data: postCounts } = await supabase
        .from("posts")
        .select("user_id")
        .in("user_id", userIds);

      // Combine the data
      return (
        users?.map((user) => {
          const subscription = subscriptions?.find(
            (s) => s.user_id === user.id
          );
          const userPostCount =
            postCounts?.filter((p) => p.user_id === user.id).length || 0;

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
          };
        }) || []
      );
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export default async function AdminUsersPage() {
  const users = await getUsers();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600">
            Manage and edit user profiles, ICP data, and content strategy
          </p>
        </div>
        <div className="text-sm text-gray-500">Total Users: {users.length}</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No users found. Check your database connection.
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">
                        {user.full_name || user.first_name || "Unknown User"}
                      </h3>
                      {getStatusBadge(user)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{user.email}</p>
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
                      {!user.onboarding_completed && (
                        <span className="text-orange-600 font-medium">
                          Onboarding incomplete
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/users/${user.id}`}>View Details</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/admin/users/${user.id}/edit`}>
                        Edit Profile
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
