import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const { title, description, type, proposition, domains } = await request.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return NextResponse.json({ error: "At least one domain is required" }, { status: 400 });
    }
    if (type === "debate" && (!proposition || !proposition.trim())) {
      return NextResponse.json({ error: "Proposition is required for debates" }, { status: 400 });
    }

    const topic = await prisma.topic.create({
      data: {
        title: title.trim(),
        description: description || null,
        type: type || "discussion",
        proposition: type === "debate" ? proposition.trim() : null,
        domains: JSON.stringify(domains),
        status: "active",
        sourceType: "evergreen",
        // userId is null → this is a system-created topic
      },
    });

    return NextResponse.json({ topic: { id: topic.id, title: topic.title } });
  } catch (error) {
    console.error("Create topic error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
