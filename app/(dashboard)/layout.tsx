import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { ClientAuthWrapper } from "@/components/auth/ClientAuthWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authentication check
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Check if user has completed onboarding
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed, is_admin")
    .eq("id", user.id)
    .single();

  // Redirect to onboarding if not completed (except for admins)
  if (!profile?.is_admin && !profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <ClientAuthWrapper>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ClientAuthWrapper>
  );
}
