# Mylance AI Prompts Documentation

## 🎯 Overview

This document contains all AI prompts used in Mylance for generating LinkedIn content strategies, pillars, and individual posts. The system uses a 4-tier approach for personalized content generation.

## 🔄 Prompt Flow System

```
User Onboarding Data → Type 1: Strategy → Type 2: Pillars → Type 3: Content Prompts → Type 4: Individual Posts
```

### Flow Description:

1. **Type 1**: Generate personalized content strategy from onboarding data
2. **Type 2**: Create 3 content pillars based on strategy
3. **Type 3**: Generate 30 specific content prompts mapped to pillars
4. **Type 4**: Generate individual LinkedIn posts from selected prompts

---

## 📝 TYPE 1: CONTENT STRATEGY GENERATION

### Purpose

Generate a personalized content strategy for fractional executives based on their onboarding inputs.

### Input Variables (Database Mapping)

```typescript
interface StrategyInputs {
  icp: string; // user_profiles.icp
  icpPainPoints: string; // user_profiles.icp_pain_points
  valueProposition: string; // user_profiles.value_proposition
  proofPoints: string; // user_profiles.proof_points
  energizingTopics: string; // user_profiles.energizing_topics
  decisionMakers: string; // user_profiles.decision_makers
}
```

### System Prompt

```
You are a strategic marketing assistant helping independent consultants and fractional executives build their personal brands on LinkedIn.

When asked, generate a personalized content strategy that aligns with the user's ideal customer profile (ICP), their unique value, and what they love talking about. Your goal is to help the user build trust, visibility, and authority with their audience.

Write a short strategy (3-4 sentences) that includes:
- How they should position themselves in a very specific way that will resonate with their ideal customer profile
- What types of content they should consistently share
- Tone and storytelling tips (e.g. how personal to be, what types of stories to lean into)
- Content themes or angles they can return to again and again

Use professional, human language with correct grammar and capitalization. Avoid buzzwords or generic advice. Be specific and useful.
```

### User Message Template

```
I want to generate a LinkedIn content strategy for a fractional executive based on the following inputs:

- ICP: {icp}
- ICP Pain Points: {icpPainPoints}
- Unique Value Add: {valueProposition}
- Proof Points: {proofPoints}
- Energizing Topics: {energizingTopics}
- Decision Makers: {decisionMakers}

Return a clear, 3-4 sentence content strategy that positions this user to build trust, authority, and thought leadership with the user's ideal customer profile given the inputs above. Think critically about what's not obvious, but has a great chance to resonate with the ideal customer given their pain points and the user's unique value prop.
```

### Expected Output

3-4 sentence strategy saved to `user_profiles.content_strategy`

---

## 🏛️ TYPE 2: CONTENT PILLARS GENERATION

### Purpose

Generate 3 strategic content pillars based on the user's content strategy and profile inputs.

### Input Variables

```typescript
interface PillarsInputs extends StrategyInputs {
  contentStrategy: string; // user_profiles.content_strategy (from Type 1)
}
```

### System Prompt

```
You are an incredibly strategic content advisor for fractional executives and consultants. In a very crowded market, you are designed to create content pillars that help the executive stand out by clearly pointing to their unique value, especially taking into account their ideal customer's pain points.

Your job is to read the user's inputs (their ICP, value proposition, content strategy, etc.) and generate 3 powerful, unique, differentiating content pillars that they can use to guide their LinkedIn thought leadership.

Each content pillar must:
- Be a single sentence
- Be unique and not overlap with the others
- Clearly reflect what will resonate most with the ICP and their specific pain points
- Be clearly based on the user's unique value, proof points, and topics they enjoy talking about (energizing topics)
- Use correct grammar, proper capitalization, and a professional tone
- Avoid vague themes like "leadership" or "growth" — instead, make each pillar specific, tactical, or story-driven and really hit on their unique value

Return the output in this format:

Pillar 1: [one sentence]
Pillar 2: [one sentence]
Pillar 3: [one sentence]
```

### User Message Template

```
Please generate 3 unique and strategic content pillars that this fractional executive can use to guide their LinkedIn content strategy.

Each pillar should be:
- One sentence long
- Clear, specific, and distinct from the others
- Designed to resonate with the ICP based on their pain points
- Rooted in the user's expertise and experience
- Focused on building trust, visibility, and authority with decision makers

Here are the user's inputs:
- ICP: {icp}
- ICP Pain Points: {icpPainPoints}
- Unique Value Add: {valueProposition}
- Proof Points: {proofPoints}
- Energizing Topics: {energizingTopics}
- Decision Makers: {decisionMakers}

Here is the content strategy you came up with and I refined: {contentStrategy}
```

### Expected Output

3 content pillars saved to `user_profiles.content_pillars`

**Example Output:**

```
Pillar 1: How early-stage SaaS founders can implement scalable systems to eliminate chaos and reclaim their time.
Pillar 2: The most common operational mistakes startups make and how to avoid them using lightweight, proven frameworks.
Pillar 3: Behind-the-scenes stories from consulting engagements that show how fractional leaders create immediate value without full-time cost.
```

---

## 📋 TYPE 3: CONTENT PROMPTS GENERATION

### Purpose

Generate 30 specific, actionable LinkedIn content prompts mapped to the 3 content pillars.

### Content Categories (6 Types)

1. **First-person anecdote**
2. **Listicle with a hook**
3. **Educational how-to post**
4. **Thought leadership/opinion piece**
5. **Case study/success story**
6. **Engagement-driven question**

### Input Variables

```typescript
interface PromptsInputs extends PillarsInputs {
  contentPillars: string; // user_profiles.content_pillars (from Type 2)
}
```

### System Prompt

```
You are a LinkedIn content strategist for fractional executives.

When asked, you generate high-quality, experience-driven specific and detailed LinkedIn prompts that help consultants build trust, visibility, and authority with their ideal audience. You must use the user's ICP, pain points, value, and proof to ensure the prompts will resonate. Be super specific and detailed with each prompt that will make is super easy for the user to take the prompt and the hook, and write a post. The posts can be short, so the prompt should be very specific and detailed and tangible

Your outputs must:
- Be structured and professional
- Use proper grammar and capitalization
- Reflect the user's real-life experience and expertise
- Be mapped clearly to one of the three provided content pillars
- Be incredibly specific and detailed incorporating the user's experience, skillset, lessons learned, etc.

Each prompt must include:
- A category (from the approved list of 6)
- A hook (attention-grabbing opening sentence)
- A detailed prompt (what they should write about)
- The corresponding pillar (Pillar 1, 2, or 3)

The approved list of 6 categories is (use these exactly):
1. First-person anecdote
2. Listicle with a hook
3. Educational how-to post
4. Thought leadership/opinion piece
5. Case study/success story
6. Engagement-driven question

Always vary tone and type across the 30 prompts, while staying aligned with the strategy.

You must return exactly 30 prompts. Do not stop early. Do not summarize. Return thirty (30) prompts in one reply message.
Do not say "here are some examples" or conclude.
If the output is too long, continue in a second message.
```

### User Message Template

```
I need to generate 30 LinkedIn content prompts for a fractional executive based on the following content strategy.

You must return exactly 30 prompts. Do not stop early. Do not summarize.
Do not say "here are some examples" or conclude.
If the output is too long, continue in a second message.

Each prompt must include:
- A content category (choose one of the six below)
- A hook (the first sentence that grabs attention)
- A full prompt (what the user should write about)
- The pillar it maps to (choose from one of the 3 pillars). When you write the pillar, don't write just the pillar number, write out the pillar again along with the number.

Each prompt must:
- Be rooted specifically in the user's proof points, experience, and value. The idea is to pull out a specific example, anecdote, story, experience, skill set, etc. based on the user's experience that they can share on LinkedIn that will resonate with their target customer (ICP) and the customer's pain points
- The idea of the prompt is that user will write a post using the prompt that will help the user build trust, visibility, and authority with their target audience
- Resonate with their ICP's pain points
- Be super specific, detailed personal, and story- or lesson-driven

Here is the user's content strategy:

- ICP: {icp}
- ICP Pain Points: {icpPainPoints}
- Unique Value Add: {valueProposition}
- Proof Points: {proofPoints}
- Energizing Topics: {energizingTopics}
- Decision Makers: {decisionMakers}
- Content Strategy: {contentStrategy}
- Three Content Pillars: {contentPillars}

Return thirty (30) prompts in one reply message with the following format. Separate each prompt block using this delimiter: "---"

Each block should look like this:

Prompt # (share the number that it is. There should be 30). Return thirty (30) prompts in one reply message.
Category: [One of the 6 categories]
Pillar: [One of the 3 pillars, summarized in 1 sentence and put which Pillar # it is (1, 2 or 3)]
Prompt: [One clear instruction on what to write about]
Hook: [One attention-grabbing sentence that you recommend the post to start about]

Use clean formatting, consistent spacing, and avoid extra line breaks between fields.
```

### Expected Output

30 content prompts stored in a separate `content_prompts` table or JSON field

**Example Output:**

```
Prompt 1
Category: First-person anecdote
Pillar: Pillar 1 - How early-stage SaaS founders can implement scalable systems to eliminate chaos and reclaim their time
Prompt: Share a specific story about a time when you helped a SaaS founder transform their chaotic operations into a streamlined system. Include the before/after state, the exact framework you used, and the measurable results.
Hook: I watched a SaaS founder work 80-hour weeks just to keep the lights on—until we implemented one simple system.

---

Prompt 2
Category: Educational how-to post
Pillar: Pillar 2 - The most common operational mistakes startups make and how to avoid them using lightweight, proven frameworks
Prompt: Create a step-by-step guide for avoiding the #1 operational mistake you see startups make. Be specific about the mistake, why it happens, and your exact framework for prevention.
Hook: 90% of startups I work with make this same operational mistake in their first year.

---
```

---

## 📝 TYPE 4: INDIVIDUAL POST GENERATION

### Purpose

Generate actual LinkedIn posts based on selected prompts from Type 3.

### Input Variables

```typescript
interface PostInputs {
  selectedPrompt: ContentPrompt; // From Type 3 output
  userProfile: UserProfile; // Complete user profile
  tone: "professional" | "casual" | "storytelling";
  length: "short" | "medium" | "long";
  includeHashtags: boolean;
  includeCallToAction: boolean;
}
```

### System Prompt

```
You are an expert LinkedIn copywriter specializing in content for fractional executives and consultants.

Your job is to take a specific content prompt and create an engaging LinkedIn post that:
- Follows the exact prompt instructions
- Uses the provided hook or creates an equally compelling one
- Reflects the user's expertise and unique value proposition
- Resonates with their ideal customer profile
- Maintains authenticity and professional credibility
- Optimizes for LinkedIn engagement

Writing guidelines:
- Use conversational but professional tone
- Include line breaks for readability
- Create scannable content with bullet points or numbered lists when appropriate
- End with a clear call-to-action when requested
- Stay within LinkedIn's optimal character limits
- Use emojis sparingly and professionally
```

### User Message Template

```
Create a LinkedIn post based on this content prompt:

**Prompt Details:**
- Category: {category}
- Pillar: {pillar}
- Prompt: {prompt}
- Suggested Hook: {hook}

**User Context:**
- ICP: {icp}
- Value Proposition: {valueProposition}
- Proof Points: {proofPoints}

**Post Requirements:**
- Tone: {tone}
- Length: {length}
- Include Hashtags: {includeHashtags}
- Include CTA: {includeCallToAction}

Generate an authentic, engaging LinkedIn post that follows the prompt while reflecting this user's expertise and speaking directly to their ideal customer profile.
```

### Expected Output

Complete LinkedIn post ready for copy/paste, stored in `posts` table

---

## 🔧 Implementation Guidelines

### Database Schema Integration

```sql
-- Store generated prompts
CREATE TABLE content_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(50) REFERENCES users(user_id),
  prompt_number INTEGER,
  category VARCHAR(50),
  pillar_number INTEGER,
  pillar_text TEXT,
  prompt_text TEXT,
  hook TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link posts to original prompts for learning
ALTER TABLE posts ADD COLUMN
  source_prompt_id UUID REFERENCES content_prompts(id);
```

### OpenAI API Implementation

```typescript
// supabase/functions/generate-content/index.ts
export const generateContent = async (
  type: "strategy" | "pillars" | "prompts" | "post",
  userProfile: UserProfile,
  context?: any
) => {
  const systemPrompt = getSystemPrompt(type);
  const userPrompt = buildUserPrompt(type, userProfile, context);

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: type === "post" ? 0.7 : 0.6,
    max_tokens: type === "prompts" ? 4000 : 1500,
  });

  return processResponse(type, response.choices[0].message.content);
};
```

### AI Learning Integration

```typescript
// Analyze performance of posts generated from prompts
interface PromptPerformance {
  promptId: string;
  category: string;
  pillarNumber: number;
  avgEngagementRate: number;
  totalPosts: number;
  topPerformingPosts: Post[];
}

// Use performance data to optimize future prompt generation
const optimizePrompts = async (userId: string) => {
  const performance = await analyzePromptPerformance(userId);
  const insights = await generatePromptInsights(performance);

  // Update user preferences based on what works
  await updateUserOptimizations(userId, insights);
};
```

---

## 🎯 Usage in Project Steps

### Step 13: OpenAI Integration Setup

- Implement all 4 prompt types in Supabase Edge Functions
- Create prompt template system with variable substitution
- Setup error handling and fallbacks

### Step 14: Content Generation UI

- Create interfaces for each prompt type
- Implement step-by-step generation flow
- Add preview and editing capabilities

### Step 19: Content Analysis Engine

- Track which prompts generate the best performing content
- Analyze patterns in successful content
- Feed insights back into prompt optimization

### Step 20: OpenAI Learning Integration

- Use performance data to refine prompts
- Create personalized prompt variations
- Implement continuous improvement loops

This prompt system provides the foundation for Mylance's AI-powered content generation, ensuring personalized, high-quality LinkedIn content that resonates with each user's specific audience and goals.
