"use client";

import { formatDistanceToNow } from "date-fns";
import { User, FileText, Settings, Eye, Edit, Trash2 } from "lucide-react";

interface AdminActivity {
  id: number;
  action: string;
  target_user_id?: string;
  target_type?: string;
  target_id?: string;
  details: Record<string, any>;
  created_at: string;
  admin_users?: {
    id: string;
    user_id: string;
    role: "admin" | "super_admin";
  };
  profiles?: {
    id: string;
    first_name?: string;
    email: string;
  };
}

interface AdminActivityFeedProps {
  activities: AdminActivity[];
}

export default function AdminActivityFeed({
  activities,
}: AdminActivityFeedProps) {
  const getActivityIcon = (action: string) => {
    switch (action) {
      case "view_user":
      case "view_analytics":
        return <Eye className="h-4 w-4" />;
      case "edit_user":
      case "edit_prompt":
        return <Edit className="h-4 w-4" />;
      case "delete_user":
      case "delete_prompt":
        return <Trash2 className="h-4 w-4" />;
      case "generate_prompts":
        return <FileText className="h-4 w-4" />;
      case "system_config":
        return <Settings className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case "delete_user":
      case "delete_prompt":
        return "bg-gradient-to-br from-red-50 to-red-100 text-red-600 border-red-200";
      case "edit_user":
      case "edit_prompt":
        return "bg-gradient-to-br from-yellow-50 to-yellow-100 text-yellow-600 border-yellow-200";
      case "generate_prompts":
        return "bg-gradient-to-br from-green-50 to-green-100 text-green-600 border-green-200";
      case "view_user":
      case "view_analytics":
        return "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200";
      default:
        return "bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 border-gray-200";
    }
  };

  const formatAction = (activity: AdminActivity) => {
    const target =
      activity.profiles?.first_name || activity.profiles?.email || "Unknown";

    switch (activity.action) {
      case "view_user":
        return `Viewed user profile for ${target}`;
      case "edit_user":
        return `Updated user profile for ${target}`;
      case "delete_user":
        return `Deleted user ${target}`;
      case "generate_prompts":
        return `Generated prompts for ${target}`;
      case "edit_prompt":
        return `Edited prompt #${activity.target_id}`;
      case "delete_prompt":
        return `Deleted prompt #${activity.target_id}`;
      case "view_analytics":
        return "Viewed platform analytics";
      case "system_config":
        return "Modified system configuration";
      case "impersonate_user":
        return `Impersonated user ${target}`;
      case "respond_feedback":
        return `Responded to feedback #${activity.target_id}`;
      case "export_data":
        return "Exported platform data";
      default:
        return `Performed ${activity.action.replace("_", " ")}`;
    }
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 border border-gray-100 h-[400px] flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full mr-3"></div>
          Recent Activity
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              No recent activity to display
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Activity will appear here as actions are performed
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full mr-3"></div>
          Recent Activity
        </h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
          {activities.length} activities
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border ${getActivityColor(
                activity.action
              )}`}
            >
              {getActivityIcon(activity.action)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 leading-relaxed">
                {formatAction(activity)}
              </p>
              <div className="flex items-center space-x-3 mt-2">
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(activity.created_at), {
                    addSuffix: true,
                  })}
                </p>
                {activity.admin_users?.role && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      activity.admin_users.role === "super_admin"
                        ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border border-purple-300"
                        : "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300"
                    }`}
                  >
                    {activity.admin_users.role === "super_admin"
                      ? "Super Admin"
                      : "Admin"}
                  </span>
                )}
              </div>
              {activity.details && Object.keys(activity.details).length > 0 && (
                <div className="mt-3">
                  <details className="group">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors">
                      📋 View details
                    </summary>
                    <div className="mt-2 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                      <pre className="text-xs text-gray-600 font-mono overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(activity.details, null, 2)}
                      </pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {activities.length >= 10 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors duration-200 cursor-pointer">
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
}
