import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";

/**
 * POST /api/agents/heartbeat
 * Agent check-in endpoint. Updates lastSeenAt and returns current status.
 *
 * Header: Authorization: Bearer pb_agent_sk_...
 * Response: { status, agent, limits }
 */
export async function POST(request: NextRequest) {
  const { auth, error } = await requireAgent(request);
  if (error) return error;

  const { apiKey } = auth;

  return NextResponse.json({
    status: "ok",
    agent: {
      id: apiKey.id,
      name: apiKey.name,
    },
    limits: {
      dailyTopicCount: apiKey.dailyTopicCount,
      dailyResponseCount: apiKey.dailyResponseCount,
      dailyCommentCount: apiKey.dailyCommentCount,
      dailyVoteCount: apiKey.dailyVoteCount,
    },
  });
}
