import {
  openai,
  DEFAULT_MODEL,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
} from "./client";
import {
  PromptGenerationRequest,
  PromptGenerationResponse,
  GeneratedPrompt,
  ContentPillar,
  UserProfile,
} from "./types";

export class AdminPromptService {
  private buildSystemPrompt(): string {
    return `You are a LinkedIn content strategist for fractional executives.

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

Always vary tone and type across the prompts, while staying aligned with the strategy.`;
  }

  private buildUserPrompt(
    userProfile: UserProfile,
    contentPillars: ContentPillar[],
    promptCount: 30 | 15,
    isAdditional = false,
    previousPrompts?: string[],
    feedback?: string
  ): string {
    const basePrompt = `I need to generate ${promptCount} LinkedIn content prompts for a fractional executive based on the following content strategy${
      isAdditional
        ? " AND incorporate feedback given on the previous prompts to make the next set of prompts even better"
        : ""
    }.

You must return exactly ${promptCount} prompts. Do not stop early. Do not summarize. 
Do not say "here are some examples" or conclude. 
${
  isAdditional ? "If the output is too long, continue in a second message." : ""
}

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
${isAdditional ? "- Make sure to avoid duplicates of the previous set" : ""}
${
  isAdditional
    ? "- Keep the counting of the prompts going from the previous information you were given. As just an example, if the last prompt was 17, you will start at 18. As another example, if the last prompt was 30, then start at 31."
    : ""
}

Here is the user's content strategy:

- ICP: ${userProfile.ideal_target_client || "Not provided"}
- ICP Pain Points: ${userProfile.client_pain_points || "Not provided"}
- Unique Value Add: ${userProfile.unique_value_proposition || "Not provided"}
- Proof Points: ${userProfile.proof_points || "Not provided"}
- Energizing Topics: ${userProfile.energizing_topics || "Not provided"}
- Decision Makers: ${userProfile.decision_makers || "Not provided"}
- Content Strategy: ${userProfile.content_strategy || "Not provided"}
Three Content Pillars: ${contentPillars
      .map((pillar) => `Pillar ${pillar.number}: ${pillar.description}`)
      .join(", ")}

${
  isAdditional && previousPrompts
    ? `Here are the previous prompts to avoid duplication: ${previousPrompts.join(
        "\n\n"
      )}`
    : ""
}
${
  isAdditional && feedback
    ? `Here is the feedback given on the prompts thus far to incorporate to make the next set of prompts better: ${feedback}`
    : ""
}

Return ${
      promptCount === 30 ? "thirty (30)" : "fifteen (15)"
    } prompts in one reply message with the following format. Separate each prompt block using this delimiter: "---"

Each block should look like this:

Prompt # (share the number that it is. There should be ${promptCount}). Return ${
      promptCount === 30 ? "thirty (30)" : "fifteen (15)"
    } prompts in one reply message. 
Category: [One of the 6 categories]  
Pillar: [One of the 3 pillars, summarized in 1 sentence and put which Pillar # it is (1, 2 or 3)]  
Prompt: [One clear instruction on what to write about]
Hook: [One attention-grabbing sentence that you recommend the post to start about]  

Use clean formatting, consistent spacing, and avoid extra line breaks between fields.`;

    return basePrompt;
  }

  private parsePromptsFromResponse(response: string): GeneratedPrompt[] {
    const prompts: GeneratedPrompt[] = [];
    const blocks = response.split("---").filter((block) => block.trim());

    for (const block of blocks) {
      const lines = block
        .trim()
        .split("\n")
        .filter((line) => line.trim());

      let promptNumber = 0;
      let category = "";
      let pillarText = "";
      let promptText = "";
      let hook = "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.match(/^Prompt\s+#?\s*(\d+)/i)) {
          const match = trimmed.match(/^Prompt\s+#?\s*(\d+)/i);
          promptNumber = match ? parseInt(match[1] || "0") : 0;
        } else if (trimmed.toLowerCase().startsWith("category:")) {
          category = trimmed.substring(9).trim();
        } else if (trimmed.toLowerCase().startsWith("pillar:")) {
          pillarText = trimmed.substring(7).trim();
        } else if (trimmed.toLowerCase().startsWith("prompt:")) {
          promptText = trimmed.substring(7).trim();
        } else if (trimmed.toLowerCase().startsWith("hook:")) {
          hook = trimmed.substring(5).trim();
        }
      }

      // Extract pillar number and description
      const pillarMatch = pillarText.match(
        /(?:pillar\s*)?(\d)\s*[:\-]?\s*(.*)/i
      );
      const pillarNumber = pillarMatch
        ? (parseInt(pillarMatch[1] || "1") as 1 | 2 | 3)
        : 1;
      const pillarDescription = pillarMatch
        ? pillarMatch[2]?.trim()
        : pillarText;

      if (promptNumber && category && promptText && hook) {
        prompts.push({
          number: promptNumber,
          category: category as any,
          pillar: {
            number: pillarNumber,
            description: pillarDescription || "",
          },
          prompt: promptText,
          hook: hook,
        });
      }
    }

    return prompts;
  }

  async generatePrompts(
    request: PromptGenerationRequest
  ): Promise<PromptGenerationResponse> {
    const startTime = Date.now();

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(
        request.userProfile,
        request.contentPillars,
        request.promptCount,
        request.isAdditional,
        request.previousPrompts,
        request.feedback
      );

      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: DEFAULT_TEMPERATURE,
        max_tokens: DEFAULT_MAX_TOKENS,
      });

      const generationTime = Date.now() - startTime;
      const content = response.choices[0]?.message?.content || "";
      const prompts = this.parsePromptsFromResponse(content);
      const totalTokens = response.usage?.total_tokens || 0;

      return {
        prompts,
        totalTokens,
        generationTime,
      };
    } catch (error) {
      console.error("Error generating prompts:", error);
      throw new Error(
        error instanceof Error
          ? `Failed to generate prompts: ${error.message}`
          : "Failed to generate prompts"
      );
    }
  }

  async generatePromptsForUser(
    userProfile: UserProfile,
    contentPillars: ContentPillar[]
  ): Promise<PromptGenerationResponse> {
    return this.generatePrompts({
      userProfile,
      contentPillars,
      promptCount: 30,
    });
  }

  async generateAdditionalPrompts(
    userProfile: UserProfile,
    contentPillars: ContentPillar[],
    previousPrompts: string[],
    feedback?: string
  ): Promise<PromptGenerationResponse> {
    return this.generatePrompts({
      userProfile,
      contentPillars,
      promptCount: 15,
      isAdditional: true,
      previousPrompts,
      feedback: feedback || "",
    }); 
  }
}

export const promptService = new AdminPromptService();
