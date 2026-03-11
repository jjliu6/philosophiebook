import { generateJSON } from "@/lib/ai";
import { HARMFUL_CONTENT_CHECK } from "@/lib/ai-prompts";

interface ModerationResult {
  safe: boolean;
  reason?: string;
}

/**
 * Check content for harmful material.
 * Only filters harmful content — does NOT judge philosophical relevance.
 * Uses the currently configured AI provider (Claude/Gemini).
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
    // If moderation fails, default to safe (don't block on moderation errors)
    console.error("Moderation check failed, defaulting to safe");
    return { safe: true };
  }
}
