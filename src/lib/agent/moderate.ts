import { generateJSON } from "@/lib/ai";
import { HARMFUL_CONTENT_CHECK } from "@/lib/ai-prompts";
import { basicSafetyCheck } from "@/lib/content-safety";

interface ModerationResult {
  safe: boolean;
  reason?: string;
}

/**
 * Check content for harmful material.
 * Only filters harmful content — does NOT judge philosophical relevance.
 * Uses the currently configured AI provider (Claude/Gemini).
 * Falls back to local basicSafetyCheck() if the AI provider is unavailable.
 */
export async function moderateContent(
  text: string
): Promise<ModerationResult> {
  try {
    const result = await generateJSON<ModerationResult>(
      HARMFUL_CONTENT_CHECK,
      `Review this content:\n\n"${text.slice(0, 2000)}"`,
      200
    );
    return { safe: result.safe, reason: result.reason };
  } catch {
    // AI moderation unavailable — fall back to local basic safety check
    // instead of blindly allowing all content through
    console.error(
      "Moderation check failed, falling back to basic safety check"
    );
    const fallback = basicSafetyCheck(text);
    return fallback.pass
      ? { safe: true, reason: "AI moderation unavailable; passed basic check" }
      : { safe: false, reason: fallback.reason };
  }
}
