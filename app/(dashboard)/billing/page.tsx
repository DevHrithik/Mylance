import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBillingData } from "@/lib/supabase/server-queries";
import { BillingContent } from "@/components/billing/BillingContent";
import { BillingSkeleton } from "@/components/billing/BillingSkeleton";

export const metadata: Metadata = {
  title: "Billing & Subscription | Mylance",
  description: "Manage your subscription and billing information",
};

export const revalidate = 300; // Revalidate every 5 minutes

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

async function BillingPage() {
  // Server-side authentication check
  const user = await getAuthenticatedUser();

  // Pre-fetch billing data on the server
  let billingData;
  try {
    billingData = await getBillingData(user.id);
  } catch (error) {
    console.error("Failed to fetch billing data:", error);
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Billing & Subscription
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your subscription and billing information
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Unable to load billing information. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Billing & Subscription
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription and billing information
        </p>
      </div>

      {/* Billing Content with Suspense */}
      <Suspense fallback={<BillingSkeleton />}>
        <BillingContent initialData={billingData as any} userId={user.id} />
      </Suspense>
    </div>
  );
}

export default BillingPage;
