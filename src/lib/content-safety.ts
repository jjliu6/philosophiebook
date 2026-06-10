/**
 * Content safety utilities for PhilosophieBook.
 *
 * Design philosophy: INPUT-LENIENT, PROMPT-ISOLATED, OUTPUT-VALIDATED.
 * We do NOT regex-filter user input for prompt-injection phrases because
 * philosophical discussion legitimately contains "ignore all rules",
 * "act as Socrates", etc.  Instead we:
 *   1. sanitize before embedding in AI prompts (structural markers only)
 *   2. validate AI output for signs of successful injection
 *   3. provide a basic safety fallback when AI moderation is unavailable
 */

// ─── Prompt Sanitization ────────────────────────────────────

/**
 * Sanitize user-supplied text before embedding it in an AI prompt.
 * Only strips structural markers that could confuse the LLM about
 * role boundaries — does NOT remove philosophical content.
 */
export function sanitizeForPrompt(text: string, maxLen: number): string {
  return text
    .slice(0, maxLen)
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, "") // zero-width chars
    .replace(/-{3,}/g, "--") // prevent fake thinker delimiters (---)
    .replace(/#{3,}/g, "##"); // prevent fake role headers (###)
}

// ─── Output Validation ──────────────────────────────────────

interface OutputValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Check AI-generated output for signs of prompt injection success.
 * Runs after generation, before writing to the database.
 */
export function validateAIOutput(
  output: string,
  systemPromptSnippets?: string[]
): OutputValidationResult {
  // Check for excessive length (may indicate injection causing verbose output)
  if (output.length > 5000) {
    return { valid: false, reason: "Response exceeds maximum length" };
  }

  // Check for system prompt leakage — if caller provides key phrases from
  // the system prompt, flag outputs that reproduce too many of them.
  if (systemPromptSnippets && systemPromptSnippets.length > 0) {
    const leakedCount = systemPromptSnippets.filter((s) =>
      output.toLowerCase().includes(s.toLowerCase())
    ).length;
    if (leakedCount > Math.ceil(systemPromptSnippets.length * 0.3)) {
      return { valid: false, reason: "Possible system prompt leak detected" };
    }
  }

  return { valid: true };
}

// ─── Basic Safety Check (fallback when AI moderation is unavailable) ─

interface SafetyCheckResult {
  pass: boolean;
  reason?: string;
}

/**
 * Lightweight, zero-token safety check for use ONLY as a fallback when
 * the AI moderation provider is unavailable.
 *
 * Intentionally narrow: only flags content that is unambiguously harmful,
 * NOT philosophical discussion of violence/morality/rules.
 */
export function basicSafetyCheck(text: string): SafetyCheckResult {
  // Direct threat patterns (requires targeting a person, not abstract discussion)
  const patterns: { test: RegExp; label: string }[] = [
    {
      test: /\b(i will|i'm going to|gonna)\s+(kill|murder|assassinate|hurt)\s+(you|him|her|them)\b/i,
      label: "direct threat",
    },
    {
      test: /(buy now|click here|free money|act fast).{0,30}(https?:\/\/|www\.)/i,
      label: "spam",
    },
    { test: /\b(doxx(ing)?|swat(ting)?)\b/i, label: "harassment" },
  ];

  for (const p of patterns) {
    if (p.test.test(text)) {
      return { pass: false, reason: p.label };
    }
  }

  // Encoding manipulation: excessive zero-width characters
  const zeroWidthCount = (
    text.match(/[\u200B\u200C\u200D\uFEFF]/g) || []
  ).length;
  if (zeroWidthCount > 5) {
    return { pass: false, reason: "encoding manipulation" };
  }

  // Repetitive junk content
  if (text.length > 50) {
    const unique = new Set(text.split("")).size;
    if (unique / text.length < 0.05) {
      return { pass: false, reason: "repetitive content" };
    }
  }

  return { pass: true };
}
