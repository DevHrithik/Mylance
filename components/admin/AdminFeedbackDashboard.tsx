"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Filter,
  Search,
  Tag,
  TrendingUp,
  Eye,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";

interface FeedbackItem {
  id: number;
  user_id: string;
  rating: number | undefined;
  feedback_text: string | undefined;
  feedback_type: string | undefined;
  is_flagged: boolean;
  admin_notes: string | undefined;
  created_at: string;
  profiles:
    | {
        full_name: string | undefined;
        email: string | undefined;
      }
    | undefined;
}

const FEEDBACK_TYPES = {
  prompt: "Prompt Quality",
  tone: "Tone & Style",
  general: "General Experience",
  other: "Other",
};

const FEEDBACK_TAGS = [
  "Product Improvement",
  "Feature Request",
  "Bug Report",
  "User Education",
  "AI Training",
  "UX Issue",
];

export function AdminFeedbackDashboard() {
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [filteredData, setFilteredData] = useState<FeedbackItem[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(
    null
  );
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    type: "all",
    search: "",
    flagged: "all",
  });
  const [stats, setStats] = useState({
    total: 0,
    byType: {} as Record<string, number>,
    flagged: 0,
    thisWeek: 0,
  });
  const [loading, setLoading] = useState(false);

  const supabase = useSupabaseClient();

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);

      // Get all feedback from both tables
      const { data: postFeedback, error: postError } = await supabase
        .from("post_feedback")
        .select(`*, profiles(full_name, email)`)
        .order("created_at", { ascending: false });

      const { data: userFeedback, error: userError } = await supabase
        .from("user_feedback")
        .select(`*, profiles(full_name, email)`)
        .order("created_at", { ascending: false });

      if (postError || userError) {
        console.error("Error fetching feedback:", postError || userError);
        return;
      }

      // Combine and simplify data
      const allFeedback: FeedbackItem[] = [
        ...(postFeedback || []).map(
          (f): FeedbackItem => ({
            id: f.id,
            user_id: f.user_id,
            rating: f.rating || undefined,
            feedback_text: f.feedback_text || undefined,
            feedback_type: f.feedback_type || "general",
            is_flagged: f.is_flagged || false,
            admin_notes: f.admin_notes || undefined,
            created_at: f.created_at || new Date().toISOString(),
            profiles: f.profiles
              ? {
                  full_name: f.profiles.full_name || undefined,
                  email: f.profiles.email || undefined,
                }
              : undefined,
          })
        ),
        ...(userFeedback || []).map(
          (f): FeedbackItem => ({
            id: f.id + 10000, // Offset to avoid ID conflicts
            user_id: f.user_id || "",
            rating: f.rating || undefined,
            feedback_text: f.feedback_text || undefined,
            feedback_type: f.feedback_type || "general",
            is_flagged: f.is_flagged || false,
            admin_notes: f.admin_notes || undefined,
            created_at: f.created_at || new Date().toISOString(),
            profiles: f.profiles
              ? {
                  full_name: f.profiles.full_name || undefined,
                  email: f.profiles.email || undefined,
                }
              : undefined,
          })
        ),
      ];

      setFeedbackData(allFeedback);

      // Calculate stats
      const typeStats = allFeedback.reduce((acc, item) => {
        const type = item.feedback_type || "other";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const thisWeekCount = allFeedback.filter(
        (item) => new Date(item.created_at) > weekAgo
      ).length;

      setStats({
        total: allFeedback.length,
        byType: typeStats,
        flagged: allFeedback.filter((item) => item.is_flagged).length,
        thisWeek: thisWeekCount,
      });
    } catch (error) {
      console.error("Error loading feedback:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const applyFilters = useCallback(() => {
    let filtered = [...feedbackData];

    if (filters.type !== "all") {
      filtered = filtered.filter((item) => item.feedback_type === filters.type);
    }

    if (filters.flagged !== "all") {
      const isFlagged = filters.flagged === "flagged";
      filtered = filtered.filter((item) => item.is_flagged === isFlagged);
    }

    if (filters.search.trim()) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.feedback_text?.toLowerCase().includes(search) ||
          item.profiles?.full_name?.toLowerCase().includes(search) ||
          item.admin_notes?.toLowerCase().includes(search)
      );
    }

    setFilteredData(filtered);
  }, [feedbackData, filters]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleViewFeedback = (feedback: FeedbackItem) => {
    setSelectedFeedback(feedback);
    setAdminNotes(feedback.admin_notes || "");
    setSelectedTags([]);
    setIsDetailModalOpen(true);
  };

  const handleToggleFlag = async (feedback: FeedbackItem) => {
    const tableName = feedback.id > 10000 ? "user_feedback" : "post_feedback";
    const realId = feedback.id > 10000 ? feedback.id - 10000 : feedback.id;

    try {
      const { error } = await supabase
        .from(tableName)
        .update({ is_flagged: !feedback.is_flagged })
        .eq("id", realId);

      if (!error) {
        await loadFeedback();
      }
    } catch (error) {
      console.error("Error toggling flag:", error);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedFeedback) return;

    const tableName =
      selectedFeedback.id > 10000 ? "user_feedback" : "post_feedback";
    const realId =
      selectedFeedback.id > 10000
        ? selectedFeedback.id - 10000
        : selectedFeedback.id;

    try {
      const { error } = await supabase
        .from(tableName)
        .update({
          admin_notes: adminNotes.trim() || null,
          admin_tags: selectedTags.length > 0 ? selectedTags : null,
        })
        .eq("id", realId);

      if (!error) {
        setIsDetailModalOpen(false);
        await loadFeedback();
      }
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading feedback...</div>
      </div>
    );
  }

  if (feedbackData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Feedback Yet</h3>
          <p className="text-gray-500 mt-1">
            User feedback will appear here once submitted.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Feedback</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Flagged</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.flagged}
                </p>
              </div>
              <Flag className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">By Type</p>
              <div className="space-y-1 text-xs">
                {Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span>
                      {FEEDBACK_TYPES[type as keyof typeof FEEDBACK_TYPES] ||
                        type}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(FEEDBACK_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.flagged}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, flagged: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="unflagged">Not Flagged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search feedback..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback ({filteredData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No feedback found matching your filters.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map((feedback) => (
                <Card key={feedback.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {FEEDBACK_TYPES[
                            feedback.feedback_type as keyof typeof FEEDBACK_TYPES
                          ] || feedback.feedback_type}
                        </Badge>
                        {feedback.is_flagged && (
                          <Badge variant="destructive">
                            <Flag className="h-3 w-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                        {feedback.rating && (
                          <Badge variant="secondary">
                            {feedback.rating}/5 ⭐
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(feedback.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        {feedback.profiles?.full_name || "Anonymous"}
                        {feedback.profiles?.email &&
                          ` (${feedback.profiles.email})`}
                      </div>

                      {feedback.feedback_text && (
                        <p className="text-sm line-clamp-2">
                          {feedback.feedback_text}
                        </p>
                      )}

                      {feedback.admin_notes && (
                        <div className="text-xs bg-blue-50 p-2 rounded">
                          <span className="font-medium">Notes: </span>
                          {feedback.admin_notes}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewFeedback(feedback)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            feedback.is_flagged ? "destructive" : "outline"
                          }
                          onClick={() => handleToggleFlag(feedback)}
                        >
                          <Flag className="h-4 w-4 mr-1" />
                          {feedback.is_flagged ? "Unflag" : "Flag"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {selectedFeedback.profiles?.full_name || "Anonymous"}
                </span>
                <span>•</span>
                <span>
                  {new Date(selectedFeedback.created_at).toLocaleString()}
                </span>
              </div>

              {selectedFeedback.feedback_text && (
                <div>
                  <h4 className="font-medium mb-2">Feedback</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">
                    {selectedFeedback.feedback_text}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">
                  Tags for Product Improvement
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {FEEDBACK_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={
                        selectedTags.includes(tag) ? "default" : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.includes(tag)
                            ? prev.filter((t) => t !== tag)
                            : [...prev, tag]
                        )
                      }
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Admin Notes</h4>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for future reference..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveNotes}>Save Notes & Tags</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
