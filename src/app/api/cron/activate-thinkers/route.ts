import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyCronSecret } from "@/lib/cron-auth";
import { scheduleDailyThinkerActivity } from "@/lib/agent/scheduler";

export async function POST(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const todayKey = new Date().toISOString().slice(0, 10);

    // Check if already activated today
    const existing = await prisma.cronState.findUnique({
      where: { key: "daily_thinker_activation" },
    });

    if (existing && existing.date.toISOString().slice(0, 10) === todayKey) {
      const previousResult = JSON.parse(existing.value);
      return NextResponse.json({
        skipped: true,
        reason: "already_activated_today",
        previous: previousResult,
      });
    }

    const result = await scheduleDailyThinkerActivity();

    // Store today's activation record
    if (existing) {
      await prisma.cronState.update({
        where: { key: "daily_thinker_activation" },
        data: {
          value: JSON.stringify(result),
          date: new Date(todayKey + "T00:00:00Z"),
        },
      });
    } else {
      await prisma.cronState.create({
        data: {
          key: "daily_thinker_activation",
          value: JSON.stringify(result),
          date: new Date(todayKey + "T00:00:00Z"),
        },
      });
    }

    return NextResponse.json({
      activated: true,
      ...result,
    });
  } catch (error) {
    console.error("Thinker activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
