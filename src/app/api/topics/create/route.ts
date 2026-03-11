import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { DOMAINS } from "@/types";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, domains } = body as {
    title?: string;
    description?: string;
    domains?: string[];
  };

  // Validate title
  const trimmedTitle = title?.trim();
  if (!trimmedTitle || trimmedTitle.length < 3 || trimmedTitle.length > 200) {
    return NextResponse.json(
      { error: "Title must be between 3 and 200 characters" },
      { status: 400 }
    );
  }

  // Validate description
  const trimmedDesc = description?.trim().slice(0, 1000) || null;

  // Validate domains
  const validDomains = (domains || []).filter((d) =>
    (DOMAINS as readonly string[]).includes(d)
  );

  const topic = await prisma.topic.create({
    data: {
      title: trimmedTitle,
      description: trimmedDesc,
      sourceType: "user",
      domains: JSON.stringify(validDomains),
      status: "active",
      userId: user.id,
    },
    select: { id: true, title: true },
  });

  return NextResponse.json(topic, { status: 201 });
}
