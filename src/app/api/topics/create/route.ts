import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { DOMAINS } from "@/types";
import { moderateContent } from "@/lib/agent/moderate";
import { scheduleTopicResponses, scheduleDebateResponses } from "@/lib/agent/scheduler";

const DAILY_TOPIC_LIMIT = 5;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // Check daily topic limit
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayTopicCount = await prisma.topic.count({
    where: {
      userId: user.id,
      createdAt: { gte: todayStart },
    },
  });
  if (todayTopicCount >= DAILY_TOPIC_LIMIT) {
    return NextResponse.json(
      { error: `Daily topic limit reached (${DAILY_TOPIC_LIMIT}). Try again tomorrow.` },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { title, description, domains, type, proposition } = body as {
    title?: string;
    description?: string;
    domains?: string[];
    type?: "discussion" | "debate";
    proposition?: string;
  };

  const topicType = type === "debate" ? "debate" : "discussion";

  // Validate title
  const trimmedTitle = title?.trim();
  if (!trimmedTitle || trimmedTitle.length < 3 || trimmedTitle.length > 200) {
    return NextResponse.json(
      { error: "Title must be between 3 and 200 characters" },
      { status: 400 }
    );
  }

  // Validate proposition for debates
  const trimmedProposition = proposition?.trim();
  if (topicType === "debate") {
    if (!trimmedProposition || trimmedProposition.length < 5 || trimmedProposition.length > 300) {
      return NextResponse.json(
        { error: "Proposition must be between 5 and 300 characters" },
        { status: 400 }
      );
    }
  }

  // Validate description
  const trimmedDesc = description?.trim().slice(0, 1000) || null;

  // Validate domains
  const validDomains = (domains || []).filter((d) =>
    (DOMAINS as readonly string[]).includes(d)
  );

  // Content moderation (harmful content check)
  const modText = `${trimmedTitle}${trimmedProposition ? ` ${trimmedProposition}` : ""}${trimmedDesc ? ` ${trimmedDesc}` : ""}`;
  const modResult = await moderateContent(modText);
  if (!modResult.safe) {
    return NextResponse.json(
      { error: modResult.reason || "Content policy violation" },
      { status: 403 }
    );
  }

  const topic = await prisma.topic.create({
    data: {
      title: trimmedTitle,
      description: trimmedDesc,
      sourceType: "user",
      type: topicType,
      proposition: topicType === "debate" ? (trimmedProposition ?? null) : null,
      domains: JSON.stringify(validDomains),
      status: "active",
      userId: user.id,
    },
    select: { id: true, title: true, type: true },
  });

  // Schedule AI thinker responses
  if (topicType === "debate") {
    await scheduleDebateResponses(topic.id);
  } else {
    await scheduleTopicResponses(topic.id);
  }

  return NextResponse.json(topic, { status: 201 });
}
