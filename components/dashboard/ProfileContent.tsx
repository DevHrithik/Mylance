"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Edit,
  Save,
  User,
  Building,
  Target,
  Briefcase,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  business_type: string | null;
  business_size: string | null;
  business_stage: string | null;
  linkedin_importance: string | null;
  investment_willingness: string | null;
  posting_mindset: string | null;
  current_posting_frequency: string | null;
  client_attraction_methods: string[] | null;
  ideal_target_client: string | null;
  client_pain_points: string | null;
  unique_value_proposition: string | null;
  proof_points: string | null;
  energizing_topics: string | null;
  decision_makers: string | null;
  content_strategy: string | null;
  heard_about_mylance: string | null;
  content_pillars: any | null;
  timezone: string | null;
  onboarding_completed: boolean | null;
  created_at: string;
  updated_at: string;
}

interface ProfileData {
  profile: Profile;
}

interface ProfileContentProps {
  initialData: ProfileData;
  userId: string;
}

export function ProfileContent({ initialData, userId }: ProfileContentProps) {
  const [profile, setProfile] = useState<Profile>(initialData.profile);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const supabase = createClient();

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load profile");
    }
  }, [userId, supabase]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          full_name: profile.full_name,
          linkedin_url: profile.linkedin_url,
          business_type: profile.business_type,
          business_size: profile.business_size,
          business_stage: profile.business_stage,
          linkedin_importance: profile.linkedin_importance,
          investment_willingness: profile.investment_willingness,
          posting_mindset: profile.posting_mindset,
          current_posting_frequency: profile.current_posting_frequency,
          client_attraction_methods: profile.client_attraction_methods,
          ideal_target_client: profile.ideal_target_client,
          client_pain_points: profile.client_pain_points,
          unique_value_proposition: profile.unique_value_proposition,
          proof_points: profile.proof_points,
          energizing_topics: profile.energizing_topics,
          decision_makers: profile.decision_makers,
          content_strategy: profile.content_strategy,
          timezone: profile.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Failed to save profile");
        return;
      }

      toast.success("Profile updated successfully!");
      setEditMode(false);
      fetchProfile(); // Refresh data
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Profile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Manage your personal and professional information
            </p>
          </div>
          <div className="flex gap-3">
            {editMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditMode(false)}
                  className="shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setEditMode(true)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 lg:w-1/2 bg-white/70 backdrop-blur border shadow-lg">
            <TabsTrigger
              value="personal"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <User className="h-4 w-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger
              value="business"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Building className="h-4 w-4 mr-2" />
              Business
            </TabsTrigger>
            <TabsTrigger
              value="strategy"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Target className="h-4 w-4 mr-2" />
              Strategy
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Content
            </TabsTrigger>
          </TabsList>

          {/* Personal Tab */}
          <TabsContent value="personal" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Photo & Basic Info */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Photo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center space-y-6">
                  <div className="relative inline-block">
                    <Avatar className="h-32 w-32 ring-4 ring-blue-100 shadow-lg">
                      <AvatarImage
                        src={profile.avatar_url || ""}
                        alt="Profile"
                      />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {getInitials(
                          profile.full_name ||
                            profile.first_name ||
                            profile.email
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute bottom-0 right-0 rounded-full h-10 w-10 shadow-lg bg-white hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-800">
                      {profile.full_name || profile.first_name || "User"}
                    </h3>
                    <p className="text-sm text-slate-600 bg-slate-50 px-3 py-1 rounded-full">
                      {profile.email}
                    </p>
                    {profile.business_type && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {profile.business_type}
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  <div className="text-left space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Member since</span>
                      <span className="font-medium">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Onboarding</span>
                      <Badge
                        variant={
                          profile.onboarding_completed ? "default" : "secondary"
                        }
                      >
                        {profile.onboarding_completed ? "Complete" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information - Continue with the rest of the UI exactly as it was... */}
              <Card className="lg:col-span-2 shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="first_name"
                        className="text-slate-700 font-medium"
                      >
                        First Name
                      </Label>
                      {editMode ? (
                        <Input
                          id="first_name"
                          value={profile.first_name || ""}
                          onChange={(e) =>
                            updateField("first_name", e.target.value)
                          }
                          className="shadow-sm border-slate-200 focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                          {profile.first_name || "Not provided"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="full_name"
                        className="text-slate-700 font-medium"
                      >
                        Full Name
                      </Label>
                      {editMode ? (
                        <Input
                          id="full_name"
                          value={profile.full_name || ""}
                          onChange={(e) =>
                            updateField("full_name", e.target.value)
                          }
                          className="shadow-sm border-slate-200 focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                          {profile.full_name || "Not provided"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-slate-700 font-medium"
                      >
                        Email
                      </Label>
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.email}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="timezone"
                        className="text-slate-700 font-medium"
                      >
                        Timezone
                      </Label>
                      {editMode ? (
                        <Select
                          value={profile.timezone || "UTC"}
                          onValueChange={(value) =>
                            updateField("timezone", value)
                          }
                        >
                          <SelectTrigger className="shadow-sm border-slate-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">
                              Eastern Time
                            </SelectItem>
                            <SelectItem value="America/Chicago">
                              Central Time
                            </SelectItem>
                            <SelectItem value="America/Denver">
                              Mountain Time
                            </SelectItem>
                            <SelectItem value="America/Los_Angeles">
                              Pacific Time
                            </SelectItem>
                            <SelectItem value="Europe/London">
                              London
                            </SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                          {profile.timezone || "UTC"}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label
                        htmlFor="linkedin_url"
                        className="text-slate-700 font-medium"
                      >
                        LinkedIn URL
                      </Label>
                      {editMode ? (
                        <Input
                          id="linkedin_url"
                          value={profile.linkedin_url || ""}
                          onChange={(e) =>
                            updateField("linkedin_url", e.target.value)
                          }
                          placeholder="https://linkedin.com/in/yourprofile"
                          className="shadow-sm border-slate-200 focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                          {profile.linkedin_url ? (
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-2"
                            >
                              <Globe className="h-4 w-4" />
                              {profile.linkedin_url}
                            </a>
                          ) : (
                            "Not provided"
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* I'll continue with the rest of the tabs in the next part due to length... */}
          {/* For now, include business tab... */}
          <TabsContent value="business" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Business Type
                    </Label>
                    {editMode ? (
                      <Select
                        value={profile.business_type || ""}
                        onValueChange={(value) =>
                          updateField("business_type", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Consulting">Consulting</SelectItem>
                          <SelectItem value="Agency">Agency</SelectItem>
                          <SelectItem value="Freelancer">Freelancer</SelectItem>
                          <SelectItem value="SaaS">SaaS</SelectItem>
                          <SelectItem value="E-commerce">E-commerce</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.business_type || "Not specified"}
                      </p>
                    )}
                  </div>

                  {/* Continue with business size and stage fields... */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Business Size
                    </Label>
                    {editMode ? (
                      <Select
                        value={profile.business_size || ""}
                        onValueChange={(value) =>
                          updateField("business_size", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue placeholder="Select business size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Solo">Solo</SelectItem>
                          <SelectItem value="2-10">2-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">
                            51-200 employees
                          </SelectItem>
                          <SelectItem value="200+">200+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.business_size || "Not specified"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Business Stage
                    </Label>
                    {editMode ? (
                      <Select
                        value={profile.business_stage || ""}
                        onValueChange={(value) =>
                          updateField("business_stage", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue placeholder="Select business stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Startup">Startup</SelectItem>
                          <SelectItem value="Growth">Growth</SelectItem>
                          <SelectItem value="Established">
                            Established
                          </SelectItem>
                          <SelectItem value="Enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.business_stage || "Not specified"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* LinkedIn Strategy Card */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    LinkedIn Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      LinkedIn Importance
                    </Label>
                    {editMode ? (
                      <Select
                        value={profile.linkedin_importance || ""}
                        onValueChange={(value) =>
                          updateField("linkedin_importance", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue placeholder="How important is LinkedIn?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Critical">Critical</SelectItem>
                          <SelectItem value="Important">Important</SelectItem>
                          <SelectItem value="Moderate">Moderate</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.linkedin_importance || "Not specified"}
                      </p>
                    )}
                  </div>

                  {/* Continue with the remaining fields... */}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Client & Target Audience */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Target Audience
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Ideal Target Client
                    </Label>
                    {editMode ? (
                      <Textarea
                        value={profile.ideal_target_client || ""}
                        onChange={(e) =>
                          updateField("ideal_target_client", e.target.value)
                        }
                        className="shadow-sm border-slate-200 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        placeholder="Describe your ideal client..."
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.ideal_target_client || "Not specified"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Client Pain Points
                    </Label>
                    {editMode ? (
                      <Textarea
                        value={profile.client_pain_points || ""}
                        onChange={(e) =>
                          updateField("client_pain_points", e.target.value)
                        }
                        className="shadow-sm border-slate-200 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        placeholder="What problems do your clients face?"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.client_pain_points || "Not specified"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Decision Makers
                    </Label>
                    {editMode ? (
                      <Textarea
                        value={profile.decision_makers || ""}
                        onChange={(e) =>
                          updateField("decision_makers", e.target.value)
                        }
                        className="shadow-sm border-slate-200 focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                        placeholder="Who are the decision makers you target?"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.decision_makers || "Not specified"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Value Proposition & Strategy */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Business Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Unique Value Proposition
                    </Label>
                    {editMode ? (
                      <Textarea
                        value={profile.unique_value_proposition || ""}
                        onChange={(e) =>
                          updateField(
                            "unique_value_proposition",
                            e.target.value
                          )
                        }
                        className="shadow-sm border-slate-200 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        placeholder="What makes you unique?"
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.unique_value_proposition || "Not specified"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Proof Points
                    </Label>
                    {editMode ? (
                      <Textarea
                        value={profile.proof_points || ""}
                        onChange={(e) =>
                          updateField("proof_points", e.target.value)
                        }
                        className="shadow-sm border-slate-200 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        placeholder="Results, testimonials, case studies..."
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.proof_points || "Not specified"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Client Attraction Methods
                    </Label>
                    {editMode ? (
                      <Select
                        value={profile.client_attraction_methods?.[0] || ""}
                        onValueChange={(value) =>
                          updateField("client_attraction_methods", [value])
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue placeholder="Primary method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Content Marketing">
                            Content Marketing
                          </SelectItem>
                          <SelectItem value="Referrals">Referrals</SelectItem>
                          <SelectItem value="Networking">Networking</SelectItem>
                          <SelectItem value="Cold Outreach">
                            Cold Outreach
                          </SelectItem>
                          <SelectItem value="Partnerships">
                            Partnerships
                          </SelectItem>
                          <SelectItem value="SEO">SEO</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.client_attraction_methods?.join(", ") ||
                          "Not specified"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Content Strategy */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Content Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Content Strategy
                    </Label>
                    {editMode ? (
                      <Textarea
                        value={profile.content_strategy || ""}
                        onChange={(e) =>
                          updateField("content_strategy", e.target.value)
                        }
                        className="shadow-sm border-slate-200 focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                        placeholder="Describe your content strategy and goals..."
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.content_strategy || "Not specified"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Energizing Topics
                    </Label>
                    {editMode ? (
                      <Textarea
                        value={profile.energizing_topics || ""}
                        onChange={(e) =>
                          updateField("energizing_topics", e.target.value)
                        }
                        className="shadow-sm border-slate-200 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                        placeholder="Topics that energize you and your audience..."
                      />
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.energizing_topics || "Not specified"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Current Posting Frequency
                    </Label>
                    {editMode ? (
                      <Select
                        value={profile.current_posting_frequency || ""}
                        onValueChange={(value) =>
                          updateField("current_posting_frequency", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue placeholder="How often do you post?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="3-4 times per week">
                            3-4 times per week
                          </SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Rarely">Rarely</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.current_posting_frequency || "Not specified"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Content Pillars & Mindset */}
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Content Pillars & Mindset
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Content Pillars
                    </Label>
                    {editMode ? (
                      <Textarea
                        value={
                          profile.content_pillars
                            ? Array.isArray(profile.content_pillars)
                              ? profile.content_pillars.join("\n\n")
                              : typeof profile.content_pillars === "string"
                              ? profile.content_pillars
                              : JSON.stringify(profile.content_pillars, null, 2)
                            : ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.includes("\n")) {
                            // Split by double newlines to create array
                            const pillars = value
                              .split("\n\n")
                              .filter((p) => p.trim());
                            updateField("content_pillars", pillars);
                          } else {
                            // Single text input
                            updateField("content_pillars", value);
                          }
                        }}
                        className="shadow-sm border-slate-200 focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                        placeholder="Enter each content pillar on a separate line, separated by double line breaks..."
                      />
                    ) : (
                      <div className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.content_pillars ? (
                          Array.isArray(profile.content_pillars) ? (
                            <ul className="space-y-3">
                              {profile.content_pillars.map((pillar, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                                  <span className="text-sm leading-relaxed">
                                    {pillar}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : typeof profile.content_pillars === "string" ? (
                            <p className="text-sm leading-relaxed">
                              {profile.content_pillars}
                            </p>
                          ) : (
                            <p className="text-sm text-slate-600 italic">
                              Complex data format - switch to edit mode to
                              modify
                            </p>
                          )
                        ) : (
                          <p className="text-sm text-slate-500 italic">
                            Not specified
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Posting Mindset
                    </Label>
                    {editMode ? (
                      <Select
                        value={profile.posting_mindset || ""}
                        onValueChange={(value) =>
                          updateField("posting_mindset", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue placeholder="Your approach to posting" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Thought Leadership">
                            Thought Leadership
                          </SelectItem>
                          <SelectItem value="Educational">
                            Educational
                          </SelectItem>
                          <SelectItem value="Personal Branding">
                            Personal Branding
                          </SelectItem>
                          <SelectItem value="Business Growth">
                            Business Growth
                          </SelectItem>
                          <SelectItem value="Industry Insights">
                            Industry Insights
                          </SelectItem>
                          <SelectItem value="Storytelling">
                            Storytelling
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.posting_mindset || "Not specified"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 font-medium">
                      Investment Willingness
                    </Label>
                    {editMode ? (
                      <Select
                        value={profile.investment_willingness || ""}
                        onValueChange={(value) =>
                          updateField("investment_willingness", value)
                        }
                      >
                        <SelectTrigger className="shadow-sm border-slate-200">
                          <SelectValue placeholder="Investment in content creation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High">
                            High - Significant investment
                          </SelectItem>
                          <SelectItem value="Medium">
                            Medium - Moderate investment
                          </SelectItem>
                          <SelectItem value="Low">
                            Low - Minimal investment
                          </SelectItem>
                          <SelectItem value="Bootstrap">
                            Bootstrap - DIY approach
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">
                        {profile.investment_willingness || "Not specified"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Writing Profile Link */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Writing Profile</h3>
                <p className="text-violet-100">
                  Customize your AI writing style and content preferences for
                  personalized content generation.
                </p>
              </div>
              <Link href="/profile/writing-profile">
                <Button
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 shadow-lg"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Writing Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
