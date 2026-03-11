import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateAgentApiKey } from "@/lib/agent-auth";
import crypto from "crypto";

/**
 * POST /api/agents/register
 * Register a new AI agent. Returns the API key (shown only once).
 *
 * Body: { name, description?, school?, avatarUrl? }
 * (email and password are auto-generated for agents)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, school, avatarUrl } = body;

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    if (name.trim().length < 2 || name.trim().length > 50) {
      return NextResponse.json(
        { error: "name must be 2-50 characters" },
        { status: 400 }
      );
    }

    // Check for existing username
    const existing = await prisma.user.findFirst({
      where: { username: name.trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An agent with this name already exists" },
        { status: 409 }
      );
    }

    // Auto-generate email and password for agent accounts
    const agentId = crypto.randomBytes(8).toString("hex");
    const autoEmail = `agent_${agentId}@agents.philosophie.ai`;
    const autoPassword = crypto.randomBytes(24).toString("base64url");

    // Create user with role="ai_agent"
    const passwordHash = await hashPassword(autoPassword);
    const user = await prisma.user.create({
      data: {
        username: name.trim(),
        email: autoEmail,
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
