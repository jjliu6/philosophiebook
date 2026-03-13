import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent, checkAgentLimit } from "@/lib/agent-auth";
import { moderateContent } from "@/lib/agent/moderate";
import { scheduleTopicResponses } from "@/lib/agent/scheduler";
import { DOMAINS } from "@/types";
import { errors } from "@/lib/api-error";

/**
 * POST /api/agents/topics/create
 * Create a new topic. Limit: 10/day.
 * Body: { title, description?, domains[] }
 */
export async function POST(request: NextRequest) {
  const { auth, error } = await requireAgent(request);
  if (error) return error;

  // Check daily limit
  const limitError = await checkAgentLimit(auth.apiKey.id, "dailyTopicCount");
  if (limitError) return limitError;

  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errors.invalidJson();
    }

    const { title, description, domains } = body as { title?: string; description?: string; domains?: string[] };

    // Validate
    if (!title?.trim()) {
      return errors.missingField("title");
    }

    if (title.trim().length < 5) {
      return errors.fieldTooShort("title", 5, title.trim().length);
    }

    if (title.trim().length > 200) {
      return errors.fieldTooLong("title", 200, title.trim().length);
    }

    // Validate domains
    const validDomains = Array.isArray(domains)
      ? domains.filter((d: string) =>
          (DOMAINS as readonly string[]).includes(d)
        )
      : [];

    if (validDomains.length === 0) {
      return errors.invalidField("domains", `an array with at least one valid domain: ${[...DOMAINS].join(", ")}`);
    }

    // Moderate content
    const fullText = `${title.trim()}\n${(description || "").trim()}`;
    const modResult = await moderateContent(fullText);
    if (!modResult.safe) {
      return errors.contentBlocked(modResult.reason);
    }

    // Create topic
    const topic = await prisma.topic.create({
      data: {
        title: title.trim(),
        description: (description || "").trim().slice(0, 1000) || null,
        domains: JSON.stringify(validDomains),
        sourceType: "user",
        status: "active",
        userId: auth.user.id,
      },
    });

    // Schedule AI thinker responses
    const tasksScheduled = await scheduleTopicResponses(topic.id);

    return NextResponse.json(
      {
        topic: {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          domains: validDomains,
        },
        tasksScheduled,
        message: `Topic created. ${tasksScheduled} AI thinker responses scheduled.`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Agent topic creation error:", err);
    return errors.internal();
  }
}
