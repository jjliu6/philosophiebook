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

async function generateAndModerate(
  existingTitles: string[],
  provider?: AIProvider
): Promise<GeneratedTopic | null> {
  const topic = await generateJSON<GeneratedTopic>(
    TOPIC_GENERATION_SYSTEM,
    topicGenerationUserPrompt(existingTitles),
    1000,
    provider
  );

  const validDomains = topic.domains.filter((d) =>
    (DOMAINS as readonly string[]).includes(d)
  );
  if (validDomains.length === 0) {
    console.warn("Generated topic has no valid domains, skipping");
    return null;
  }
  topic.domains = validDomains;

  const modResult = await generateJSON<ModerationResult>(
    MODERATION_SYSTEM,
    `Topic title: "${topic.title}"\nDescription: "${topic.description}"\nDomains: ${topic.domains.join(", ")}`,
    300,
    provider
  );

  if (!modResult.safe) {
    console.warn(`Topic failed moderation: ${modResult.reason}`);
    return null;
  }

  return topic;
}

export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    // Optional: caller can specify provider via query param or body
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

    let generatedTopic: GeneratedTopic | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      generatedTopic = await generateAndModerate(existingTitles, provider);
      if (generatedTopic) break;
    }

    if (!generatedTopic) {
      return NextResponse.json(
        { error: "Failed to generate a safe topic after retries" },
        { status: 500 }
      );
    }

    const topic = await prisma.topic.create({
      data: {
        title: generatedTopic.title,
        description: generatedTopic.description,
        domains: JSON.stringify(generatedTopic.domains),
        sourceType: "news",
        status: "active",
      },
    });

    const tasksScheduled = await scheduleTopicResponses(topic.id);

    return NextResponse.json({
      provider: selectedProvider,
      topic: { id: topic.id, title: topic.title },
      tasksScheduled,
    });
  } catch (error) {
    console.error("Topic generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
