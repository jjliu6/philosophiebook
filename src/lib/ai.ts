import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Provider types ──────────────────────────────────────────
export type AIProvider = "claude" | "gemini";

/**
 * Determine which provider to use.
 * Priority: explicit parameter > env AI_PROVIDER > whichever key is available.
 */
export function getProvider(explicit?: AIProvider): AIProvider {
  if (explicit) return explicit;

  const envProvider = process.env.AI_PROVIDER as AIProvider | undefined;
  if (envProvider === "claude" || envProvider === "gemini") return envProvider;

  // Auto-detect: prefer whichever key is set
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your-anthropic-api-key-here") return "claude";
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here") return "gemini";

  // Default
  return "claude";
}

// ─── Claude client (singleton) ───────────────────────────────
const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

function getAnthropicClient(): Anthropic {
  if (!globalForAnthropic.anthropic) {
    globalForAnthropic.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return globalForAnthropic.anthropic;
}

// ─── Gemini client (singleton) ───────────────────────────────
const globalForGemini = globalThis as unknown as {
  gemini: GoogleGenerativeAI | undefined;
};

function getGeminiClient(): GoogleGenerativeAI {
  if (!globalForGemini.gemini) {
    globalForGemini.gemini = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY || ""
    );
  }
  return globalForGemini.gemini;
}

// ─── Claude generation ───────────────────────────────────────
async function generateTextClaude(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const client = getAnthropicClient();
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }
  return textBlock.text;
}

// ─── Gemini generation ───────────────────────────────────────
// Model priority: env GEMINI_MODEL > gemini-2.5-pro (stable default)
// Set GEMINI_MODEL="gemini-3.1-pro-preview" in .env to use the latest
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro";

async function generateTextGemini(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
    generationConfig: {
      maxOutputTokens: maxTokens,
    },
  });

  const result = await model.generateContent(userPrompt);
  const text = result.response.text();
  if (!text) {
    throw new Error(`No text response from Gemini (${GEMINI_MODEL})`);
  }
  return text;
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Generate text using the configured AI provider.
 * Supports Claude and Gemini. Provider selection:
 *   1. Explicit `provider` parameter
 *   2. `AI_PROVIDER` env var ("claude" | "gemini")
 *   3. Auto-detect based on which API key is set
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1500,
  provider?: AIProvider
): Promise<string> {
  const selected = getProvider(provider);

  if (selected === "gemini") {
    return generateTextGemini(systemPrompt, userPrompt, maxTokens);
  }
  return generateTextClaude(systemPrompt, userPrompt, maxTokens);
}

/**
 * Generate JSON from AI. Parses the response as JSON.
 */
export async function generateJSON<T = unknown>(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1000,
  provider?: AIProvider
): Promise<T> {
  const text = await generateText(systemPrompt, userPrompt, maxTokens, provider);
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = jsonMatch[1]!.trim();
  return JSON.parse(jsonStr) as T;
}
