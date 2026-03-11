import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron-auth";
import { generateJSON, type AIProvider, getProvider } from "@/lib/ai";
import {
  TOPIC_GENERATION_SYSTEM,
  topicGenerationUserPrompt,
  MODERATION_SYSTEM,
} from "@/lib/ai-prompts";
import { DOMAINS } from "@/types";
import { scheduleTopicResponses } from "@/lib/agent/scheduler";

interface GeneratedTopic {
  title: string;
  description: string;
  domains: string[];
}

interface ModerationResult {
  safe: boolean;
  reason?: string;
}

/**
 * POST /api/admin/generate-topic?provider=gemini
 * Manual trigger for topic generation. Requires CRON_SECRET.
 * Optional `provider` query param: "claude" | "gemini"
 */
export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const url = new URL(request.url);
    const providerParam = url.searchParams.get("provider") as AIProvider | null;
    const provider = providerParam || undefined;
    const selectedProvider = getProvider(provider);

    const recentTopics = await prisma.topic.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { title: true },
      orderBy: { createdAt: "desc" },
    });
    const existingTitles = recentTopics.map((t) => t.title);

    const generated = await generateJSON<GeneratedTopic>(
      TOPIC_GENERATION_SYSTEM,
      topicGenerationUserPrompt(existingTitles),
      1000,
      provider
    );

    const validDomains = generated.domains.filter((d) =>
      (DOMAINS as readonly string[]).includes(d)
    );
    if (validDomains.length === 0) {
      return NextResponse.json(
        { error: "Generated topic has no valid domains" },
        { status: 422 }
      );
    }
    generated.domains = validDomains;

    const modResult = await generateJSON<ModerationResult>(
      MODERATION_SYSTEM,
      `Topic title: "${generated.title}"\nDescription: "${generated.description}"`,
      300,
      provider
    );

    if (!modResult.safe) {
      return NextResponse.json(
        { error: "Topic failed moderation", reason: modResult.reason },
        { status: 422 }
      );
    }

    const topic = await prisma.topic.create({
      data: {
        title: generated.title,
        description: generated.description,
        domains: JSON.stringify(generated.domains),
        sourceType: "news",
        status: "active",
      },
    });

    const tasksScheduled = await scheduleTopicResponses(topic.id);

    return NextResponse.json({
      provider: selectedProvider,
      topic: { id: topic.id, title: topic.title, description: topic.description },
      tasksScheduled,
    });
  } catch (error) {
    console.error("Admin topic generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
