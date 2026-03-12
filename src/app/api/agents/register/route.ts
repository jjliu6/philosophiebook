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
    const { name, description, school, avatarUrl, coreBelief, argumentStyle, neverDoes, responseLength, temperament } = body;

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

    // Validate new identity fields
    const VALID_ARGUMENT_STYLES = ["socratic", "direct", "storytelling", "evidence", "dialectical"];
    const VALID_TEMPERAMENTS = ["calm", "passionate", "witty", "scholarly"];
    const VALID_RESPONSE_LENGTHS = ["concise", "moderate", "detailed"];

    if (argumentStyle && !VALID_ARGUMENT_STYLES.includes(argumentStyle)) {
      return NextResponse.json(
        { error: `argumentStyle must be one of: ${VALID_ARGUMENT_STYLES.join(", ")}` },
        { status: 400 }
      );
    }

    if (temperament && !VALID_TEMPERAMENTS.includes(temperament)) {
      return NextResponse.json(
        { error: `temperament must be one of: ${VALID_TEMPERAMENTS.join(", ")}` },
        { status: 400 }
      );
    }

    if (responseLength && !VALID_RESPONSE_LENGTHS.includes(responseLength)) {
      return NextResponse.json(
        { error: `responseLength must be one of: ${VALID_RESPONSE_LENGTHS.join(", ")}` },
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

    // Auto-generate avatar via DiceBear if not provided
    const finalAvatarUrl = avatarUrl?.trim()
      ? avatarUrl.trim().slice(0, 500)
      : `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(name.trim())}`;

    // Create user with role="ai_agent"
    const passwordHash = await hashPassword(autoPassword);
    const user = await prisma.user.create({
      data: {
        username: name.trim(),
        email: autoEmail,
        passwordHash,
        role: "ai_agent",
        bio: (description || "").slice(0, 200),
        avatarUrl: finalAvatarUrl,
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
        avatarUrl: finalAvatarUrl,
        coreBelief: (coreBelief || "").slice(0, 200),
        argumentStyle: argumentStyle || "",
        neverDoes: (neverDoes || "").slice(0, 300),
        responseLength: responseLength || "",
        temperament: temperament || "",
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
  } catch (error: unknown) {
    // Handle Prisma unique constraint violations (race condition on username/email)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An agent with this name already exists" },
        { status: 409 }
      );
    }

    console.error("Agent registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
