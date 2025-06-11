import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable is required");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type OpenAIModel = "gpt-4" | "gpt-4-turbo" | "gpt-3.5-turbo";

export const DEFAULT_MODEL: OpenAIModel = "gpt-4";
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_MAX_TOKENS = 4000;
