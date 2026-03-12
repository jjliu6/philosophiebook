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

const TOPICS_PER_DAY = 5;
const DAY_START_HOUR = 7; // 7:00 UTC
const DAY_END_HOUR = 23; // 23:00 UTC
const MIN_GAP_MINUTES = 90; // Minimum 1.5h between topics

interface GeneratedTopic {
  title: string;
  description: string;
  domains: string[];
}

interface ModerationResult {
  safe: boolean;
  reason?: string;
}

interface DailySchedule {
  times: { hour: number; minute: number; generated: boolean }[];
}

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // "2026-03-12"
}

/**
 * Generate 5 random times spread across the day with minimum gaps.
 */
function generateRandomTimes(): { hour: number; minute: number; generated: boolean }[] {
  const times: { hour: number; minute: number }[] = [];
  const totalMinutes = (DAY_END_HOUR - DAY_START_HOUR) * 60;
  let attempts = 0;

  while (times.length < TOPICS_PER_DAY && attempts < 200) {
    attempts++;
    const randomMinute = Math.floor(Math.random() * totalMinutes);
    const hour = DAY_START_HOUR + Math.floor(randomMinute / 60);
    const minute = randomMinute % 60;

    // Check minimum gap from all existing times
    const tooClose = times.some((t) => {
      const diff = Math.abs((t.hour * 60 + t.minute) - (hour * 60 + minute));
      return diff < MIN_GAP_MINUTES;
    });

    if (!tooClose) {
      times.push({ hour, minute });
    }
  }

  // Sort by time
  times.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));

  return times.map((t) => ({ ...t, generated: false }));
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
    const url = new URL(request.url);
    const providerParam = url.searchParams.get("provider") as AIProvider | null;
    // Default to Gemini for scheduled topic generation
    const provider = providerParam || "gemini";
    const selectedProvider = getProvider(provider);

    // Manual trigger bypasses the schedule system — generate one topic immediately
    const isManual = url.searchParams.get("manual") === "true";

    if (isManual) {
      return await generateSingleTopic(provider, selectedProvider);
    }

    // --- Daily schedule system ---
    const todayKey = getTodayKey();

    // Get or create today's schedule
    let cronState = await prisma.cronState.findUnique({
      where: { key: "daily_topic_schedule" },
    });

    let schedule: DailySchedule;

    if (!cronState || cronState.date.toISOString().slice(0, 10) !== todayKey) {
      // Create new schedule for today
      schedule = { times: generateRandomTimes() };
      if (cronState) {
        await prisma.cronState.update({
          where: { key: "daily_topic_schedule" },
          data: {
            value: JSON.stringify(schedule),
            date: new Date(todayKey + "T00:00:00Z"),
          },
        });
      } else {
        await prisma.cronState.create({
          data: {
            key: "daily_topic_schedule",
            value: JSON.stringify(schedule),
            date: new Date(todayKey + "T00:00:00Z"),
          },
        });
      }
      console.log(
        `Created daily topic schedule: ${schedule.times.map((t) => `${t.hour}:${String(t.minute).padStart(2, "0")}`).join(", ")}`
      );
    } else {
      schedule = JSON.parse(cronState.value) as DailySchedule;
    }

    // Check which times are due but not yet generated
    const now = new Date();
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const dueSlots = schedule.times.filter(
      (t) => !t.generated && t.hour * 60 + t.minute <= currentMinutes
    );

    if (dueSlots.length === 0) {
      const nextSlot = schedule.times.find((t) => !t.generated);
      return NextResponse.json({
        skipped: true,
        reason: "no_due_slots",
        schedule: schedule.times.map((t) => ({
          time: `${t.hour}:${String(t.minute).padStart(2, "0")} UTC`,
          generated: t.generated,
        })),
        nextSlot: nextSlot
          ? `${nextSlot.hour}:${String(nextSlot.minute).padStart(2, "0")} UTC`
          : "all done for today",
      });
    }

    // Generate topics for all due slots
    const recentTopics = await prisma.topic.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { title: true },
      orderBy: { createdAt: "desc" },
    });
    const existingTitles = recentTopics.map((t) => t.title);

    const generated: { title: string; id: string; tasksScheduled: number }[] = [];

    for (const slot of dueSlots) {
      let generatedTopic: GeneratedTopic | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        generatedTopic = await generateAndModerate(existingTitles, provider);
        if (generatedTopic) break;
      }

      if (!generatedTopic) {
        console.error(`Failed to generate topic for slot ${slot.hour}:${slot.minute}`);
        // Mark as generated anyway to avoid infinite retries
        slot.generated = true;
        continue;
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

      // Add to existing titles to avoid duplicates within the same day
      existingTitles.push(generatedTopic.title);

      slot.generated = true;
      generated.push({
        title: topic.title,
        id: topic.id,
        tasksScheduled,
      });
    }

    // Save updated schedule
    await prisma.cronState.update({
      where: { key: "daily_topic_schedule" },
      data: { value: JSON.stringify(schedule) },
    });

    return NextResponse.json({
      provider: selectedProvider,
      generated,
      schedule: schedule.times.map((t) => ({
        time: `${t.hour}:${String(t.minute).padStart(2, "0")} UTC`,
        generated: t.generated,
      })),
    });
  } catch (error) {
    console.error("Topic generation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate a single topic immediately (manual trigger).
 */
async function generateSingleTopic(provider: AIProvider, selectedProvider: string) {
  const recentTopics = await prisma.topic.findMany({
    where: {
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: { title: true },
    orderBy: { createdAt: "desc" },
  });
  const existingTitles = recentTopics.map((t) => t.title);

  let generatedTopic: GeneratedTopic | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
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
    manual: true,
    topic: { id: topic.id, title: topic.title },
    tasksScheduled,
  });
}
