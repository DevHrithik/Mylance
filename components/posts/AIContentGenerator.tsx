"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sparkles,
  Wand2,
  RefreshCw,
  Copy,
  Edit,
  Send,
  Lightbulb,
  Zap,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Hash,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { FeedbackButton } from "@/components/common/FeedbackButton";

interface GeneratedContent {
  id: string;
  content: string;
  tone: string;
  length: string;
  hooks: string[];
  characterCount: number;
  hashtags: string[];
  isEditing?: boolean;
  postId?: number;
  generationHistoryId?: number;
}

export function AIContentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>(
    []
  );
  const [prompt, setPrompt] = useState("");
  const [keywords, setKeywords] = useState("");
  const [contentType, setContentType] = useState("thought-leadership");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [targetAudience, setTargetAudience] = useState("professionals");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeCallToAction, setIncludeCallToAction] = useState(true);
  const [callToActionType, setCallToActionType] = useState("engagement");
  const [industry, setIndustry] = useState("technology");

  const contentTypes = [
    {
      value: "thought-leadership",
      label: "Thought Leadership",
      icon: Lightbulb,
    },
    { value: "personal-story", label: "Personal Story", icon: Wand2 },
    { value: "industry-insight", label: "Industry Insight", icon: ChevronDown },
    { value: "tips-advice", label: "Tips & Advice", icon: ChevronRight },
    { value: "how-to", label: "How-To Guide", icon: ChevronRight },
    { value: "behind-scenes", label: "Behind the Scenes", icon: Wand2 },
  ];

  const industries = [
    "Technology",
    "Consulting",
    "Finance",
    "Healthcare",
    "Education",
    "Marketing",
    "Sales",
    "HR",
    "Legal",
    "Real Estate",
    "Other",
  ];

  const callToActionTypes = [
    { value: "engagement", label: "Ask for Engagement" },
    { value: "connection", label: "Connect with Me" },
    { value: "website", label: "Visit Website" },
    { value: "dm", label: "Send DM" },
    { value: "comment", label: "Share in Comments" },
    { value: "none", label: "No CTA" },
  ];

  const recentPrompts = [
    "Lessons learned from scaling a business",
    "The future of remote work",
    "AI impact on professional services",
    "Building authentic professional relationships",
  ];

  const characterCount = prompt.length;
  const isPromptValid = prompt.trim().length >= 10;

  const mockGenerate = async () => {
    setIsGenerating(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockContent: GeneratedContent[] = [
      {
        id: "1",
        content:
          "🚀 The future of work isn't just remote—it's outcome-driven.\n\nAfter 3 years of helping 50+ companies transition to remote-first operations, I've discovered something counterintuitive:\n\nThe most successful remote teams don't focus on hours worked.\nThey focus on outcomes delivered.\n\nHere's what I learned:\n\n✅ Set clear expectations, not strict schedules\n✅ Measure results, not activity\n✅ Trust your team's judgment\n✅ Provide the right tools, then step back\n\nThe companies that embraced this mindset saw:\n→ 35% increase in productivity\n→ 50% reduction in turnover\n→ 90% employee satisfaction scores\n\nWhat's your take on outcome-driven work?\n\n#RemoteWork #Leadership #Productivity #FutureOfWork #Management",
        tone: "Professional",
        length: "Medium",
        hooks: [
          "The future of work isn't just remote",
          "something counterintuitive",
          "Here's what I learned",
        ],
        characterCount: 847,
        hashtags: [
          "#RemoteWork",
          "#Leadership",
          "#Productivity",
          "#FutureOfWork",
          "#Management",
        ],
      },
      {
        id: "2",
        content:
          "💡 Remote work revelation: The best teams I work with have ONE thing in common.\n\nThey've mastered asynchronous communication.\n\nNot Slack. Not Zoom. Not email chains.\n\nThey've learned to communicate in a way that doesn't require everyone to be online at the same time.\n\nThis changes everything:\n• No more 'quick sync' meetings that derail deep work\n• No more waiting for responses to move forward\n• No more timezone conflicts blocking progress\n\nThe secret? Document decisions, not just discussions.\n\nTry this framework:\n1. Context: What's the situation?\n2. Decision: What are we choosing?\n3. Rationale: Why this choice?\n4. Next steps: Who does what by when?\n\nSimple. Effective. Game-changing.\n\nWhat's your experience with async communication? Drop a comment below! 👇\n\n#RemoteWork #Communication #Productivity #TeamWork",
        tone: "Professional",
        length: "Medium",
        hooks: [
          "Remote work revelation",
          "ONE thing in common",
          "This changes everything",
        ],
        characterCount: 912,
        hashtags: [
          "#RemoteWork",
          "#Communication",
          "#Productivity",
          "#TeamWork",
        ],
      },
    ];

    setGeneratedContent(mockContent);
    setIsGenerating(false);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    // TODO: Add toast notification
  };

  const handleRegenerateVariation = (id: string) => {
    // TODO: Regenerate specific variation
    console.log("Regenerate variation:", id);
  };

  const handlePromptSelect = (selectedPrompt: string) => {
    setPrompt(selectedPrompt);
  };

  const handleEditContent = (id: string) => {
    setGeneratedContent((prev) =>
      prev.map((content) =>
        content.id === id ? { ...content, isEditing: true } : content
      )
    );
  };

  const handleSaveEdit = (id: string, newContent: string) => {
    setGeneratedContent((prev) =>
      prev.map((content) =>
        content.id === id
          ? {
              ...content,
              content: newContent,
              characterCount: newContent.length,
              isEditing: false,
            }
          : content
      )
    );
  };

  const handleCancelEdit = (id: string) => {
    setGeneratedContent((prev) =>
      prev.map((content) =>
        content.id === id ? { ...content, isEditing: false } : content
      )
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Input Form */}
      <div className="xl:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Content Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prompt Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt">
                  What would you like to write about? *
                </Label>
                <div className="text-xs text-gray-500">
                  {characterCount}/500 characters
                </div>
              </div>
              <Textarea
                id="prompt"
                placeholder="e.g., The importance of remote work in modern business, lessons from my first year as a consultant..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className={`resize-none ${
                  !isPromptValid && prompt.length > 0 ? "border-red-300" : ""
                }`}
                maxLength={500}
              />
              {!isPromptValid && prompt.length > 0 && (
                <p className="text-xs text-red-600">
                  Please provide at least 10 characters
                </p>
              )}

              {/* Recent Prompts */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-600">
                  Quick Start Templates:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {recentPrompts.map((recentPrompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handlePromptSelect(recentPrompt)}
                    >
                      {recentPrompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Keywords (Optional)
              </Label>
              <Input
                id="keywords"
                placeholder="e.g., productivity, leadership, innovation"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                Separate keywords with commas to guide AI generation
              </p>
            </div>

            <Separator />

            {/* Content Settings */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Content Settings</Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger className="mt-1">
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

                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem
                          key={ind.toLowerCase()}
                          value={ind.toLowerCase()}
                        >
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tone">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="authoritative">
                        Authoritative
                      </SelectItem>
                      <SelectItem value="inspirational">
                        Inspirational
                      </SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="length">Content Length</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">
                        Short (&lt; 500 chars)
                      </SelectItem>
                      <SelectItem value="medium">
                        Medium (500-1000 chars)
                      </SelectItem>
                      <SelectItem value="long">
                        Long (&gt; 1000 chars)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Select
                  value={targetAudience}
                  onValueChange={setTargetAudience}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professionals">Professionals</SelectItem>
                    <SelectItem value="entrepreneurs">Entrepreneurs</SelectItem>
                    <SelectItem value="executives">Executives</SelectItem>
                    <SelectItem value="consultants">Consultants</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="job-seekers">Job Seekers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Advanced Options */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Advanced Options</Label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="hashtags" className="text-sm">
                      Include Hashtags
                    </Label>
                    <p className="text-xs text-gray-600">
                      Add relevant hashtags to increase reach
                    </p>
                  </div>
                  <Switch
                    id="hashtags"
                    checked={includeHashtags}
                    onCheckedChange={setIncludeHashtags}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cta" className="text-sm">
                      Include Call-to-Action
                    </Label>
                    <p className="text-xs text-gray-600">
                      Encourage engagement with your post
                    </p>
                  </div>
                  <Switch
                    id="cta"
                    checked={includeCallToAction}
                    onCheckedChange={setIncludeCallToAction}
                  />
                </div>

                {includeCallToAction && (
                  <div className="ml-4">
                    <Label htmlFor="cta-type" className="text-xs">
                      Call-to-Action Type
                    </Label>
                    <Select
                      value={callToActionType}
                      onValueChange={setCallToActionType}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {callToActionTypes.map((cta) => (
                          <SelectItem key={cta.value} value={cta.value}>
                            {cta.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={mockGenerate}
              disabled={!isPromptValid || isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Content with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tips & Generated Content */}
      <div className="space-y-6">
        {/* Content Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              💡 Tips for Better Content
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>• Be specific with your topic and context</p>
            <p>• Include personal experiences and examples</p>
            <p>• Use numbers and data when possible</p>
            <p>• Ask questions to encourage engagement</p>
            <p>• Keep paragraphs short for readability</p>
          </CardContent>
        </Card>

        {/* AI Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generations Used</span>
                <span>32 / 50</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "64%" }}
                ></div>
              </div>
              <p className="text-xs text-gray-600">Resets on Feb 15th</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated Content - Full Width */}
      <div className="xl:col-span-3 space-y-4">
        {generatedContent.length === 0 && !isGenerating && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">
                Generated content will appear here
              </p>
              <p className="text-sm mt-1">
                Fill in your topic and preferences, then click generate to start
              </p>
            </CardContent>
          </Card>
        )}

        {isGenerating && (
          <Card>
            <CardContent className="py-12 text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-lg font-medium text-gray-900">
                AI is crafting your content...
              </p>
              <p className="text-sm text-gray-600 mt-1">
                This usually takes 10-15 seconds
              </p>
            </CardContent>
          </Card>
        )}

        {generatedContent.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {generatedContent.map((content, index) => (
              <Card key={content.id} className="h-fit">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">
                        Variation {index + 1}
                      </CardTitle>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          {content.tone}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {content.characterCount} chars
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {content.isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById(
                                `edit-content-${content.id}`
                              ) as HTMLTextAreaElement;
                              handleSaveEdit(content.id, textarea.value);
                            }}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            title="Save changes"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelEdit(content.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            title="Cancel editing"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditContent(content.id)}
                            className="h-8 w-8 p-0"
                            title="Edit content"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(content.content)}
                            className="h-8 w-8 p-0"
                            title="Copy content"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRegenerateVariation(content.id)
                            }
                            className="h-8 w-8 p-0"
                            title="Regenerate variation"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {content.isEditing ? (
                    <Textarea
                      id={`edit-content-${content.id}`}
                      defaultValue={content.content}
                      className="min-h-[200px] text-sm resize-none"
                      placeholder="Edit your content..."
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm p-4 bg-gray-50 rounded-lg border max-h-80 overflow-y-auto">
                      {content.content}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-600">
                        Suggested Hooks:
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {content.hooks.map((hook, hookIndex) => (
                          <Badge
                            key={hookIndex}
                            variant="secondary"
                            className="text-xs"
                          >
                            &ldquo;{hook}&rdquo;
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-gray-600">
                        Hashtags:
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {content.hashtags.map((hashtag, hashIndex) => (
                          <Badge
                            key={hashIndex}
                            variant="outline"
                            className="text-xs text-blue-600"
                          >
                            {hashtag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={content.isEditing}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post to LinkedIn
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={content.isEditing}
                    >
                      Save as Draft
                    </Button>
                    <FeedbackButton
                      type="post"
                      targetId={content.postId || parseInt(content.id)}
                      title={`Generated Content - Variation ${index + 1}`}
                      content={content.content}
                      {...(content.generationHistoryId && {
                        generationHistoryId: content.generationHistoryId,
                      })}
                      variant="outline"
                      size="sm"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
