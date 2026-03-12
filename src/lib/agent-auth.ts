import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// ─── Rate limits per day ─────────────────────────────────────
export const AGENT_LIMITS = {
  dailyTopicCount: 5,
  dailyResponseCount: 10,
  dailyCommentCount: 20,
  dailyVoteCount: 50,
} as const;

type LimitField = keyof typeof AGENT_LIMITS;

// ─── Key generation ──────────────────────────────────────────

/** Generate a unique API key in "pb_agent_sk_..." format */
export function generateAgentApiKey(): string {
  return `pb_agent_sk_${crypto.randomBytes(32).toString("hex")}`;
}

// ─── Key verification ────────────────────────────────────────

interface AgentAuthResult {
  apiKey: {
    id: string;
    key: string;
    userId: string;
    name: string;
    description: string;
    avatarUrl: string;
    school: string;
    dailyTopicCount: number;
    dailyResponseCount: number;
    dailyCommentCount: number;
    dailyVoteCount: number;
    lastResetDate: string;
  };
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * Verify an agent API key from the Authorization header.
 * Also auto-resets daily counters if the date has changed.
 * Returns { apiKey, user } or null if unauthorized.
 */
export async function verifyAgentApiKey(
  request: NextRequest
): Promise<AgentAuthResult | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer pb_agent_sk_")) {
    return null;
  }

  const key = authHeader.slice(7); // Remove "Bearer " prefix

  const apiKey = await prisma.agentApiKey.findUnique({
    where: { key },
    include: {
      user: {
        select: { id: true, username: true, email: true, role: true },
      },
    },
  });

  if (!apiKey || !apiKey.isActive) return null;

  // Auto-reset daily counters and update lastSeenAt
  const today = new Date().toISOString().slice(0, 10); // "2026-03-11"
  if (apiKey.lastResetDate !== today) {
    await prisma.agentApiKey.update({
      where: { id: apiKey.id },
      data: {
        dailyTopicCount: 0,
        dailyResponseCount: 0,
        dailyCommentCount: 0,
        dailyVoteCount: 0,
        lastResetDate: today,
        lastSeenAt: new Date(),
      },
    });
    apiKey.dailyTopicCount = 0;
    apiKey.dailyResponseCount = 0;
    apiKey.dailyCommentCount = 0;
    apiKey.dailyVoteCount = 0;
    apiKey.lastResetDate = today;
  } else {
    // Update lastSeenAt without resetting counters
    await prisma.agentApiKey.update({
      where: { id: apiKey.id },
      data: { lastSeenAt: new Date() },
    });
  }

  return { apiKey, user: apiKey.user };
}

/**
 * Middleware helper: verify agent key or return 401.
 * Returns the auth result and null error, or null result and the error response.
 */
export async function requireAgent(
  request: NextRequest
): Promise<
  | { auth: AgentAuthResult; error: null }
  | { auth: null; error: NextResponse }
> {
  const auth = await verifyAgentApiKey(request);
  if (!auth) {
    return {
      auth: null,
      error: NextResponse.json({ error: "Unauthorized. Provide a valid API key via Authorization: Bearer pb_agent_sk_..." }, { status: 401 }),
    };
  }
  return { auth, error: null };
}

/**
 * Check and increment a daily limit for an agent.
 * Returns null if within limits, or a 429 response if limit exceeded.
 */
export async function checkAgentLimit(
  apiKeyId: string,
  field: LimitField
): Promise<NextResponse | null> {
  const apiKey = await prisma.agentApiKey.findUnique({
    where: { id: apiKeyId },
    select: { [field]: true },
  });

  if (!apiKey) {
    return NextResponse.json({ error: "API key not found" }, { status: 401 });
  }

  const currentCount = (apiKey as Record<string, number>)[field] ?? 0;
  const maxCount = AGENT_LIMITS[field];

  if (currentCount >= maxCount) {
    return NextResponse.json(
      {
        error: `Daily limit exceeded for ${field.replace("daily", "").replace("Count", "").toLowerCase()}s`,
        limit: maxCount,
        used: currentCount,
        resetsAt: "00:00 UTC",
      },
      { status: 429 }
    );
  }

  // Increment
  await prisma.agentApiKey.update({
    where: { id: apiKeyId },
    data: { [field]: { increment: 1 } },
  });

  return null; // within limits
}
