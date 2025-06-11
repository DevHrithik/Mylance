"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Target,
  Users,
  MessageSquare,
  TrendingUp,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Star,
  PenTool,
  Search,
  Eye,
} from "lucide-react";

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Best Practices content
  const bestPractices = {
    keyPrinciples: [
      {
        title: "Speak to a Specific Audience",
        icon: <Target className="h-5 w-5" />,
        description:
          "Effective thought leadership starts with knowing exactly who you're speaking to. Tailor your message to resonate with your ideal client or decision-maker audience.",
        example:
          "If your ideal audience is early-stage SaaS founders, write posts like, 'One common mistake I've seen founders make when scaling operations is X. Here's what works instead.'",
      },
      {
        title: "First-Person Storytelling",
        icon: <MessageSquare className="h-5 w-5" />,
        description:
          "Be the guide, not the hero. Root your content in authentic, first-person stories that share valuable lessons.",
        tips: [
          "Tell specific stories with tangible outcomes",
          "Include mistakes and vulnerability",
          "Find the right balance between personal and general advice",
        ],
      },
      {
        title: "Social Proof: Build Credibility",
        icon: <Users className="h-5 w-5" />,
        description:
          "Establish authority by weaving social proof into your stories.",
        methods: [
          "Use recognizable company names (if possible)",
          "Focus on outcomes if company names aren't possible",
          "Leverage audience engagement as social proof",
        ],
      },
    ],

    formatting: {
      dos: [
        "Short, punchy sentences",
        "Proper spacing with line breaks",
        "Bullet points & numbered lists",
        "Strong hooks that give readers a reason to keep reading",
        "Clear takeaways that add value",
        "Minimal self-promotion (8-9 out of 10 posts should provide pure value)",
      ],
      donts: [
        "'You' posts that feel preachy",
        "Fluffy, generic insights with no depth",
        "Dense paragraphs without spacing",
        "Excessive use of emojis",
      ],
    },

    contentPillars: [
      {
        title: "Scaling Operations",
        description:
          "Share wins, lessons, and best practices from past roles or consulting projects.",
      },
      {
        title: "Common Mistakes",
        description:
          "Share mistakes you've seen companies make and how to avoid them.",
      },
      {
        title: "Your Consulting Journey",
        description:
          "Share personal insights, challenges, and wins from running your own consulting business.",
      },
    ],
  };

  // Post Examples content
  const postExamples = [
    {
      type: "First-Person Anecdote",
      icon: <MessageSquare className="h-4 w-4" />,
      content: `Last year, I faced one of my toughest challenges when launching a new product line.

I remember sitting in a room with a diverse team of engineers, designers, and marketers, all with different opinions on the product's direction. I shared my own experiences from my early days in consulting and how I learned to navigate conflicting ideas to reach a consensus.

The result? We not only launched on time, but we exceeded our initial sales targets by 20%. This experience reinforced that real leadership is about uniting a team around a shared vision—even when the road isn't clear. What challenges have you overcome by bringing your team together?`,
      tags: ["storytelling", "leadership", "experience"],
    },
    {
      type: "Listicle with a Hook",
      icon: <TrendingUp className="h-4 w-4" />,
      content: `5 Lessons I Learned from Launching Multiple Startups:

1. **Embrace the Chaos:** When every day is unpredictable, clear priorities are your lifeline.
2. **Listen First, Act Second:** Understanding your team's insights can unlock breakthrough ideas.
3. **Measure Everything:** Data isn't just numbers; it's the story behind your success.
4. **Fail Fast, Learn Faster:** Mistakes are inevitable, but every failure is a stepping stone.
5. **Stay Authentic:** Your unique journey is your strongest asset—don't hide it.

Which lesson resonates with you the most?`,
      tags: ["tips", "startup", "entrepreneurship"],
    },
    {
      type: "Educational How-To Post",
      icon: <BookOpen className="h-4 w-4" />,
      content: `How to Optimize Your Product Launch in 3 Simple Steps:

1. **Define Clear Objectives:** Start with measurable goals—know what success looks like.
2. **Leverage Your Data:** Use customer feedback and performance metrics to iterate quickly.
3. **Communicate Transparently:** Share your journey, including both wins and lessons learned, to build trust with your audience.

Implementing these steps has helped me drive growth in every venture I've been part of. What's one step you can take today to improve your launch strategy?`,
      tags: ["how-to", "product", "strategy"],
    },
    {
      type: "Thought Leadership/Opinion Piece",
      icon: <Lightbulb className="h-4 w-4" />,
      content: `In today's fast-paced market, authenticity isn't a buzzword—it's a necessity.

Too many leaders resort to generic advice that doesn't resonate. I believe the true power of thought leadership lies in sharing the raw, unfiltered truth of our journeys—the challenges, the failures, and the victories.

When you speak from personal experience, you build a connection that data alone never can.

Let's rethink what it means to be a leader: it's not just about being right; it's about being real. What does authentic leadership mean to you?`,
      tags: ["opinion", "authenticity", "leadership"],
    },
    {
      type: "Case Study/Success Story",
      icon: <Star className="h-4 w-4" />,
      content: `At Chatzy.ai, we faced a critical challenge: our sales were stagnating. By reworking our campaign strategy and redesigning key features, we tripled our sales in just one month. Here's what we did:

- Revamped the payments page to streamline user experience.
- Launched a targeted 'Refer and Earn' initiative that boosted engagement.
- Implemented design changes that enhanced usability and retention.

These actions not only increased revenue but also built a foundation of trust with our customers. Have you implemented a change that made a measurable impact?`,
      tags: ["case-study", "growth", "results"],
    },
    {
      type: "Engagement-Driven Question",
      icon: <Users className="h-4 w-4" />,
      content: `What's the one piece of advice you wish you had when you first started leading product launches?

For me, it was learning to balance data-driven decisions with intuitive, real-world insights.

That combination has been key to building sustainable growth.

I'd love to hear your experiences—drop your thoughts below!`,
      tags: ["engagement", "question", "community"],
    },
  ];

  const filteredExamples = postExamples.filter(
    (example) =>
      example.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      example.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      example.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Resources & Best Practices
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Your complete guide to creating compelling LinkedIn content that
          builds trust, authority, and drives meaningful engagement.
        </p>
      </div>

      <Tabs defaultValue="best-practices" className="space-y-8">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100">
          <TabsTrigger
            value="best-practices"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Best Practices
          </TabsTrigger>
          <TabsTrigger
            value="examples"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <PenTool className="h-4 w-4 mr-2" />
            Post Examples
          </TabsTrigger>
        </TabsList>

        {/* Best Practices Tab */}
        <TabsContent value="best-practices" className="space-y-8">
          {/* Why Thought Leadership */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800">
                <Target className="h-6 w-6" />
                <span>Why We Do Thought Leadership</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                Thought leadership on LinkedIn is designed to build{" "}
                <strong>trust, visibility, and authority</strong> by helping
                consultants and fractional executives consistently share
                valuable, experience-driven content.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-blue-200">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-800">
                      Grows Awareness
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Increase visibility among decision-makers by sharing
                      tangible outcomes, industry insights, and lessons learned.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-blue-200">
                  <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-800">
                      Builds Trust
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Demonstrate expertise by telling authentic, first-person
                      stories that show you&apos;ve &quot;been there, done
                      that.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Principles */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Key Principles for Success
            </h2>
            <div className="grid gap-6">
              {bestPractices.keyPrinciples.map((principle, index) => (
                <Card
                  key={index}
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <CardTitle className="flex items-center space-x-2">
                      {principle.icon}
                      <span>{principle.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      {principle.description}
                    </p>

                    {principle.example && (
                      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          Example:
                        </p>
                        <p className="text-sm text-blue-700 italic">
                          &quot;{principle.example}&quot;
                        </p>
                      </div>
                    )}

                    {principle.tips && (
                      <div className="space-y-2">
                        <p className="font-medium text-gray-800">
                          Key Elements:
                        </p>
                        <ul className="space-y-1">
                          {principle.tips.map((tip, tipIndex) => (
                            <li
                              key={tipIndex}
                              className="flex items-start space-x-2"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">
                                {tip}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {principle.methods && (
                      <div className="space-y-2">
                        <p className="font-medium text-gray-800">Methods:</p>
                        <ul className="space-y-1">
                          {principle.methods.map((method, methodIndex) => (
                            <li
                              key={methodIndex}
                              className="flex items-start space-x-2"
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">
                                {method}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Formatting Guidelines */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center space-x-2 text-green-800">
                <Eye className="h-5 w-5" />
                <span>Formatting & Readability</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-800 flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Do This</span>
                  </h3>
                  <ul className="space-y-2">
                    {bestPractices.formatting.dos.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-red-800 flex items-center space-x-2">
                    <XCircle className="h-4 w-4" />
                    <span>Avoid This</span>
                  </h3>
                  <ul className="space-y-2">
                    {bestPractices.formatting.donts.map((item, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Pillars */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <CardTitle className="flex items-center space-x-2 text-purple-800">
                <Target className="h-5 w-5" />
                <span>Content Pillars Example</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 mb-4">
                We recommend identifying <strong>3 core content pillars</strong>{" "}
                based on your niche and audience:
              </p>
              <div className="grid gap-4">
                {bestPractices.contentPillars.map((pillar, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-800">
                        {pillar.title}
                      </h3>
                      <p className="text-sm text-purple-700 mt-1">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Post Examples Tab */}
        <TabsContent value="examples" className="space-y-8">
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search examples..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Examples Grid */}
          <div className="grid gap-6">
            {filteredExamples.map((example, index) => (
              <Card
                key={index}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-purple-800">
                      {example.icon}
                      <span>{example.type}</span>
                    </CardTitle>
                    <div className="flex space-x-1">
                      {example.tags.map((tag, tagIndex) => (
                        <Badge
                          key={tagIndex}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-purple-400">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                      {example.content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredExamples.length === 0 && (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No examples found
              </h3>
              <p className="text-gray-600">Try adjusting your search terms.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
