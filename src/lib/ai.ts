import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "./db";

// ─── Provider types ──────────────────────────────────────────
export type AIProvider = "claude" | "gemini" | "openai";

interface ResolvedProvider {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

/**
 * Get the ordered list of active providers from DB, falling back to env vars.
 */
async function getDbProviders(): Promise<ResolvedProvider[]> {
  try {
    const rows = await prisma.llmProvider.findMany({
      where: { isActive: true },
      orderBy: { priority: "asc" },
    });
    if (rows.length > 0) {
      return rows.map((r) => ({
        provider: r.provider as AIProvider,
        apiKey: r.apiKey,
        model: r.model,
      }));
    }
  } catch {
    // DB not available or table doesn't exist yet — fall through to env vars
  }
  return [];
}

/**
 * Resolve provider chain: DB providers first, then env var fallbacks.
 */
async function resolveProviders(explicit?: AIProvider): Promise<ResolvedProvider[]> {
  const dbProviders = await getDbProviders();

  if (dbProviders.length > 0) {
    // If explicit provider requested, move matching ones to front
    if (explicit) {
      const matching = dbProviders.filter((p) => p.provider === explicit);
      const rest = dbProviders.filter((p) => p.provider !== explicit);
      return [...matching, ...rest];
    }
    return dbProviders;
  }

  // Fallback: build from env vars (backward compatible)
  const envProviders: ResolvedProvider[] = [];

  const envProvider = (explicit || process.env.AI_PROVIDER) as AIProvider | undefined;

  if (
    (envProvider === "gemini" || !envProvider) &&
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "your-gemini-api-key-here"
  ) {
    envProviders.push({
      provider: "gemini",
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
    });
  }

  if (
    (envProvider === "claude" || !envProvider) &&
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== "your-anthropic-api-key-here"
  ) {
    envProviders.push({
      provider: "claude",
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: "claude-sonnet-4-20250514",
    });
  }

  // If explicit was requested, sort it first
  if (explicit) {
    envProviders.sort((a, b) => (a.provider === explicit ? -1 : b.provider === explicit ? 1 : 0));
  }

  return envProviders.length > 0
    ? envProviders
    : [{ provider: "claude", apiKey: process.env.ANTHROPIC_API_KEY || "", model: "claude-sonnet-4-20250514" }];
}

// ─── Kept for backward compat ───────────────────────────────
export function getProvider(explicit?: AIProvider): AIProvider {
  if (explicit) return explicit;
  const envProvider = process.env.AI_PROVIDER as AIProvider | undefined;
  if (envProvider === "claude" || envProvider === "gemini") return envProvider;
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "your-anthropic-api-key-here") return "claude";
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here") return "gemini";
  return "claude";
}

// ─── Generation by provider ─────────────────────────────────

async function generateWithProvider(
  resolved: ResolvedProvider,
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number,
  jsonMode = false
): Promise<string> {
  if (resolved.provider === "claude") {
    const client = new Anthropic({ apiKey: resolved.apiKey });
    const message = await client.messages.create({
      model: resolved.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text response from Claude");
    return textBlock.text;
  }

  if (resolved.provider === "gemini") {
    const genAI = new GoogleGenerativeAI(resolved.apiKey);
    const model = genAI.getGenerativeModel({
      model: resolved.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
        // Ask Gemini for raw JSON so it doesn't wrap the payload in ```json
        // markdown fences (which can get truncated and break JSON.parse).
        ...(jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    });
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    if (!text) throw new Error(`No text response from Gemini (${resolved.model})`);
    return text;
  }

  if (resolved.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolved.apiKey}`,
      },
      body: JSON.stringify({
        model: resolved.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }

  throw new Error(`Unknown provider: ${resolved.provider}`);
}

// ─── Public API ──────────────────────────────────────────────

/**
 * Generate text using AI with automatic fallback.
 * Resolution order:
 *   1. DB-configured providers (ordered by priority)
 *   2. Environment variable API keys (backward compatible)
 *   3. On failure: try next provider in chain
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1500,
  provider?: AIProvider,
  jsonMode = false
): Promise<string> {
  const chain = await resolveProviders(provider);
  let lastError: Error | null = null;

  for (const resolved of chain) {
    try {
      return await generateWithProvider(resolved, systemPrompt, userPrompt, maxTokens, jsonMode);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[AI] ${resolved.provider}/${resolved.model} failed, trying next...`, lastError.message);
    }
  }

  throw lastError || new Error("No AI providers available");
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
  const text = await generateText(systemPrompt, userPrompt, maxTokens, provider, true);
  return parseJsonResponse<T>(text);
}

/**
 * Parse a model response as JSON, tolerating markdown code fences — including
 * an unterminated opening ```json fence (which happens when the response is
 * truncated) and stray prose around the JSON object.
 */
function parseJsonResponse<T>(text: string): T {
  let s = text.trim();

  // Prefer a fully fenced ```json ... ``` block when present.
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    s = fenced[1].trim();
  } else {
    // Otherwise strip a leading/trailing fence that may be unterminated.
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }

  try {
    return JSON.parse(s) as T;
  } catch {
    // Last resort: extract the outermost {...} or [...] span.
    const start = s.search(/[{[]/);
    const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
    if (start !== -1 && end > start) {
      return JSON.parse(s.slice(start, end + 1)) as T;
    }
    throw new Error(`Model did not return valid JSON: ${s.slice(0, 200)}`);
  }
}
