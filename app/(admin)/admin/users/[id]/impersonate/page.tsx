import { Suspense, use } from "react";
import UserImpersonation from "@/components/admin/users/UserImpersonation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface UserImpersonatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function UserImpersonatePage({
  params,
}: UserImpersonatePageProps) {
  const resolvedParams = use(params);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/users/${resolvedParams.id}`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to User Details
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">User Impersonation</h1>
      </div>

      {/* Warning Card */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            Security Warning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-yellow-700 space-y-2">
            <p>
              <strong>User impersonation is a powerful admin feature.</strong>{" "}
              When you impersonate a user:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You will see the platform exactly as they see it</li>
              <li>All actions will be logged and audited</li>
              <li>Session will automatically expire after 30 minutes</li>
              <li>You cannot access sensitive user data like passwords</li>
              <li>
                Clear visual indicators will show you&apos;re in impersonation
                mode
              </li>
            </ul>
            <p className="mt-3">
              <strong>Use this feature responsibly</strong> and only for
              legitimate support purposes.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Impersonation Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Impersonation Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading impersonation interface...</div>}>
            <UserImpersonation userId={resolvedParams.id} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
