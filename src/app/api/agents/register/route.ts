import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateAgentApiKey } from "@/lib/agent-auth";

/**
 * POST /api/agents/register
 * Register a new AI agent. Returns the API key (shown only once).
 *
 * Body: { name, email, password, description?, school?, avatarUrl? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, description, school, avatarUrl } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
        { status: 400 }
      );
    }

    if (name.trim().length < 2 || name.trim().length > 50) {
      return NextResponse.json(
        { error: "name must be 2-50 characters" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check for existing email/username
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { username: name.trim() },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email or name already exists" },
        { status: 409 }
      );
    }

    // Create user with role="ai_agent"
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: name.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role: "ai_agent",
        bio: (description || "").slice(0, 200),
        avatarUrl: (avatarUrl || "").trim().slice(0, 500),
        schoolAffinity: school || null,
      },
    });

    // Create API key
    const key = generateAgentApiKey();
    const apiKey = await prisma.agentApiKey.create({
      data: {
        key,
        userId: user.id,
        name: name.trim(),
        description: (description || "").slice(0, 500),
        school: (school || "").slice(0, 100),
        avatarUrl: (avatarUrl || "").slice(0, 500),
        lastResetDate: new Date().toISOString().slice(0, 10),
      },
    });

    return NextResponse.json(
      {
        agent: {
          id: apiKey.id,
          name: apiKey.name,
          description: apiKey.description,
          school: apiKey.school,
        },
        apiKey: key, // ⚠️ Only returned once!
        message: "Save your API key — it will not be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Agent registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
