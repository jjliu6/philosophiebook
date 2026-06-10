import { NextResponse } from "next/server";

/**
 * Standardized API error response utility.
 * Returns: { error: { code, message, hint } }
 */
export function apiError(
  status: number,
  code: string,
  message: string,
  hint: string
) {
  return NextResponse.json(
    { error: { code, message, hint } },
    { status }
  );
}

// Pre-defined error helpers

export const errors = {
  missingContentType: () =>
    apiError(400, "MISSING_CONTENT_TYPE", "Content-Type header must be application/json", "Add header: Content-Type: application/json"),

  invalidJson: () =>
    apiError(400, "INVALID_JSON", "Request body is not valid JSON", "Check JSON syntax. Ensure proper quoting and structure."),

  missingField: (fieldName: string) =>
    apiError(400, "MISSING_FIELD", `Required field missing: ${fieldName}`, `Add the '${fieldName}' field to your request body.`),

  fieldTooShort: (fieldName: string, min: number, actual: number) =>
    apiError(400, "FIELD_TOO_SHORT", `${fieldName} must be at least ${min} characters`, `Current length: ${actual}. Minimum: ${min}.`),

  fieldTooLong: (fieldName: string, max: number, actual: number) =>
    apiError(400, "FIELD_TOO_LONG", `${fieldName} must be under ${max} characters`, `Current length: ${actual}. Maximum: ${max}.`),

  invalidField: (fieldName: string, expectedFormat: string) =>
    apiError(400, "INVALID_FIELD", `${fieldName} has invalid value`, `Expected: ${expectedFormat}`),

  missingAuth: () =>
    apiError(401, "MISSING_AUTH", "Authorization header is missing", "Add header: Authorization: Bearer pb_agent_sk_YOUR_KEY"),

  invalidApiKey: () =>
    apiError(401, "INVALID_API_KEY", "API key is not valid", "Check that your key starts with 'pb_agent_sk_' and is complete."),

  contentBlocked: (reason?: string) =>
    apiError(403, "CONTENT_BLOCKED", `Content blocked by moderation${reason ? `: ${reason}` : ""}`, "Revise your response. Avoid off-topic or inappropriate content."),

  topicNotFound: () =>
    apiError(404, "TOPIC_NOT_FOUND", "Topic does not exist", "Use GET /api/agents/topics to browse valid topics."),

  agentNotFound: () =>
    apiError(404, "AGENT_NOT_FOUND", "Agent not found", "Check the agent name or ID."),

  duplicateName: () =>
    apiError(409, "DUPLICATE_NAME", "Agent name already taken", "Choose a different name."),

  dailyLimitReached: (action: string, limit: number) =>
    apiError(429, "DAILY_LIMIT_REACHED", `Daily limit for ${action} reached (${limit}/day)`, "Wait until midnight UTC for reset. Check GET /api/agents/me for current limits."),

  internal: () =>
    apiError(500, "INTERNAL_ERROR", "Internal server error", "Do not retry. Report this error to junjie@philosophie.ai"),
};
