"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, TrendingUp, Check } from "lucide-react";

interface EditExample {
  id: string;
  title: string;
  original: string;
  edited: string;
  learningPoint: string;
  improvement: string;
  editType: "tone" | "length" | "structure" | "word_choice";
}

const editExamples: EditExample[] = [
  {
    id: "1",
    title: "Tone Adjustment",
    original:
      "I want to share some amazing insights about digital marketing strategies that will revolutionize your business approach.",
    edited:
      "Here's what I've learned about digital marketing strategies that actually move the needle for businesses.",
    learningPoint:
      "User prefers conversational, authentic tone over corporate marketing speak",
    improvement:
      "AI now generates content with more personal, practical language",
    editType: "tone",
  },
  {
    id: "2",
    title: "Structure Improvement",
    original:
      "Artificial intelligence is transforming the way we work and interact with technology in unprecedented ways.",
    edited:
      "AI is changing how we work. It's not just about automation anymore - it's about amplifying human creativity.\n\nHere are 3 ways I've seen this play out:",
    editType: "structure",
    learningPoint:
      "User prefers clear structure with specific examples and shorter paragraphs",
    improvement:
      "AI now breaks content into digestible sections with clear examples",
  },
  {
    id: "3",
    title: "Word Choice",
    original:
      "To maximize your productivity, you should implement these proven methodologies that successful professionals utilize.",
    edited:
      "Want to get more done? Skip the complex systems.\n\nHere's what actually works (learned this the hard way):",
    editType: "word_choice",
    learningPoint:
      "User avoids corporate jargon and prefers simple, direct language",
    improvement: "AI vocabulary adapts to use simpler, more authentic language",
  },
];

const getEditTypeColor = (type: string) => {
  const colors = {
    tone: "bg-blue-100 text-blue-800",
    length: "bg-green-100 text-green-800",
    structure: "bg-purple-100 text-purple-800",
    word_choice: "bg-yellow-100 text-yellow-800",
  };
  return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
};

export default function EditComparisonDemo() {
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  return (
    <Card className="border-2 border-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          How Your Edits Teach the AI
        </CardTitle>
        <CardDescription>
          See real examples of how user edits improve AI content generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {editExamples.map((example) => (
            <div
              key={example.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className={getEditTypeColor(example.editType)}>
                    {example.title}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedExample(
                      selectedExample === example.id ? null : example.id
                    )
                  }
                >
                  {selectedExample === example.id ? "Hide" : "View"} Details
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-700 flex items-center gap-1">
                    Before (AI Generated)
                  </h4>
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-gray-700">
                    {example.original}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-green-700 flex items-center gap-1">
                    After (User Edited)
                  </h4>
                  <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-gray-700 whitespace-pre-line">
                    {example.edited}
                  </div>
                </div>
              </div>

              {selectedExample === example.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="flex items-start gap-2">
                    <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">
                        Learning Point
                      </h5>
                      <p className="text-sm text-gray-600">
                        {example.learningPoint}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">
                        AI Improvement
                      </h5>
                      <p className="text-sm text-gray-600">
                        {example.improvement}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50 rounded">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-blue-900">
                      This pattern is now applied to future content generation
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <Brain className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                The Learning Process
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                    1
                  </div>
                  <span className="text-blue-800">Analyze your edits</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                    2
                  </div>
                  <span className="text-blue-800">Identify patterns</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
                    3
                  </div>
                  <span className="text-blue-800">Apply to future content</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
