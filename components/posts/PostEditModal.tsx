"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Bold,
  Italic,
  Underline,
  Hash,
  AtSign,
  Link2,
  Trash2,
  FileText,
  Users,
  TrendingUp,
  Lightbulb,
  BookOpen,
} from "lucide-react";
interface Post {
  id: string;
  title: string;
  content: string;
  status: "draft" | "used" | "archived";
  contentType: string;
  createdAt: string;
  engagement?: string;
  linkedinUrl?: string;
  hashtags?: string[];
  mentions?: string[];
}

interface PostEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onSave: (updatedPost: Post) => void;
}

const contentTypes = [
  {
    value: "thought-leadership",
    label: "Thought Leadership",
    icon: Lightbulb,
  },
  { value: "personal-story", label: "Personal Story", icon: Users },
  { value: "industry-insight", label: "Industry Insight", icon: TrendingUp },
  { value: "tips-advice", label: "Tips & Advice", icon: BookOpen },
  { value: "how-to", label: "How-To Guide", icon: FileText },
  { value: "behind-scenes", label: "Behind the Scenes", icon: Users },
];

export function PostEditModal({
  isOpen,
  onClose,
  post,
  onSave,
}: PostEditModalProps) {
  const [editedPost, setEditedPost] = useState<Post | null>(null);
  const [originalContent, setOriginalContent] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isFormatting, setIsFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    if (post) {
      setEditedPost({ ...post });
      setOriginalContent(post.content);
      setErrors({});
    }
  }, [post]);

  if (!editedPost || !post) return null;

  const characterCount = editedPost.content.length;
  const maxCharacters = 3000;
  const charactersLeft = maxCharacters - characterCount;

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!editedPost.title.trim()) {
      newErrors.title = "Must add the title";
    }

    if (!editedPost.content.trim()) {
      newErrors.content = "Must add the content";
    }

    if (editedPost.content.length > maxCharacters) {
      newErrors.content = "Content exceeds maximum character limit";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateForm()) {
      // Track content edits if content was changed
      onSave(editedPost);
      onClose();
    }
  };

  const handleDelete = () => {
    // TODO: Add confirmation dialog
    console.log("Delete post:", editedPost.id);
  };

  const handleFormatting = (type: "bold" | "italic" | "underline") => {
    const textarea = document.getElementById(
      "content-editor"
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editedPost.content.substring(start, end);

    if (selectedText) {
      let formattedText = selectedText;

      switch (type) {
        case "bold":
          formattedText = `**${selectedText}**`;
          break;
        case "italic":
          formattedText = `*${selectedText}*`;
          break;
        case "underline":
          formattedText = `__${selectedText}__`;
          break;
      }

      const newContent =
        editedPost.content.substring(0, start) +
        formattedText +
        editedPost.content.substring(end);

      setEditedPost({ ...editedPost, content: newContent });
    }

    setIsFormatting({ ...isFormatting, [type]: !isFormatting[type] });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-xl font-semibold">Edit Post</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Status:</Label>
            <Badge
              variant={
                editedPost.status === "draft"
                  ? "secondary"
                  : editedPost.status === "used"
                  ? "default"
                  : "outline"
              }
              className={
                editedPost.status === "draft"
                  ? "bg-orange-100 text-orange-700"
                  : editedPost.status === "used"
                  ? "bg-green-100 text-green-700"
                  : "text-gray-500"
              }
            >
              {editedPost.status === "draft"
                ? "Draft"
                : editedPost.status === "used"
                ? "Posted"
                : "Archived"}
            </Badge>
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="title"
              value={editedPost.title}
              onChange={(e) =>
                setEditedPost({ ...editedPost, title: e.target.value })
              }
              placeholder="Enter post title..."
              className={errors.title ? "border-red-300" : ""}
            />
            {errors.title && (
              <p className="text-xs text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="content-type" className="text-sm font-medium">
              Content Type
            </Label>
            <Select
              value={editedPost.contentType.toLowerCase().replace(/\s+/g, "-")}
              onValueChange={(value) => {
                const contentType = contentTypes.find(
                  (ct) => ct.value === value
                );
                setEditedPost({
                  ...editedPost,
                  contentType: contentType?.label || value,
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Content Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="content-editor" className="text-sm font-medium">
                Content *
              </Label>
              <div className="text-xs text-gray-500">
                Characters left: {charactersLeft}
              </div>
            </div>

            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 p-2 border rounded-lg bg-gray-50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormatting("bold")}
                className={`h-8 w-8 p-0 ${
                  isFormatting.bold ? "bg-blue-100" : ""
                }`}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormatting("italic")}
                className={`h-8 w-8 p-0 ${
                  isFormatting.italic ? "bg-blue-100" : ""
                }`}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFormatting("underline")}
                className={`h-8 w-8 p-0 ${
                  isFormatting.underline ? "bg-blue-100" : ""
                }`}
              >
                <Underline className="h-4 w-4" />
              </Button>
              <div className="mx-2 h-4 w-px bg-gray-300" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Hash className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <AtSign className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Link2 className="h-4 w-4" />
              </Button>
            </div>

            <Textarea
              id="content-editor"
              value={editedPost.content}
              onChange={(e) =>
                setEditedPost({ ...editedPost, content: e.target.value })
              }
              placeholder="Write your LinkedIn post content here..."
              className={`min-h-[200px] resize-none ${
                errors.content ? "border-red-300" : ""
              }`}
              maxLength={maxCharacters}
            />
            {errors.content && (
              <p className="text-xs text-red-600">{errors.content}</p>
            )}
          </div>

          {/* LinkedIn URL */}
          {editedPost.linkedinUrl && (
            <div className="space-y-2">
              <Label htmlFor="linkedin-url" className="text-sm font-medium">
                LinkedIn URL
              </Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md">
                  linkedin.com/posts/
                </span>
                <Input
                  id="linkedin-url"
                  value={
                    editedPost.linkedinUrl?.replace(
                      "https://linkedin.com/posts/",
                      ""
                    ) || ""
                  }
                  onChange={(e) =>
                    setEditedPost({
                      ...editedPost,
                      linkedinUrl: `https://linkedin.com/posts/${e.target.value}`,
                    })
                  }
                  className="rounded-l-none"
                  placeholder="post-id"
                />
              </div>
            </div>
          )}

          {/* Engagement */}
          {editedPost.engagement && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Engagement</Label>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-700 font-medium">
                  {editedPost.engagement}
                </span>
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={Object.keys(errors).length > 0}
              >
                Save changes
              </Button>
            </div>
          </div>

          {/* Validation Error */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">
                You need to complete all the information requested to save
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
