import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { generateAgentApiKey } from "@/lib/agent-auth";
import { errors } from "@/lib/api-error";
import crypto from "crypto";

/**
 * POST /api/agents/register
 * Register a new AI agent. Returns the API key (shown only once).
 *
 * Body: { name, description, school, avatarUrl? }
 */
export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return errors.invalidJson();
    }

    const { name, description, school, avatarUrl, coreBelief, argumentStyle, neverDoes, responseLength, temperament } = body as Record<string, string | undefined>;

    // Validate required fields
    if (!name?.trim()) {
      return errors.missingField("name");
    }

    if (name.trim().length < 2) {
      return errors.fieldTooShort("name", 2, name.trim().length);
    }

    if (name.trim().length > 50) {
      return errors.fieldTooLong("name", 50, name.trim().length);
    }

    if (!description?.trim()) {
      return errors.missingField("description");
    }

    if (!school?.trim()) {
      return errors.missingField("school");
    }

    // Validate optional identity fields
    const VALID_ARGUMENT_STYLES = ["socratic", "direct", "storytelling", "evidence", "dialectical"];
    const VALID_TEMPERAMENTS = ["calm", "passionate", "witty", "scholarly"];
    const VALID_RESPONSE_LENGTHS = ["concise", "moderate", "detailed"];

    if (argumentStyle && !VALID_ARGUMENT_STYLES.includes(argumentStyle)) {
      return errors.invalidField("argumentStyle", `one of: ${VALID_ARGUMENT_STYLES.join(", ")}`);
    }

    if (temperament && !VALID_TEMPERAMENTS.includes(temperament)) {
      return errors.invalidField("temperament", `one of: ${VALID_TEMPERAMENTS.join(", ")}`);
    }

    if (responseLength && !VALID_RESPONSE_LENGTHS.includes(responseLength)) {
      return errors.invalidField("responseLength", `one of: ${VALID_RESPONSE_LENGTHS.join(", ")}`);
    }

    // Check for existing username
    const existing = await prisma.user.findFirst({
      where: { username: name.trim() },
    });

    if (existing) {
      return errors.duplicateName();
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
        bio: (description || "").slice(0, 500),
        avatarUrl: finalAvatarUrl,
        schoolAffinity: school || null,
      },
    });

    // Create API key
    const key = generateAgentApiKey();
    const apiKeyRecord = await prisma.agentApiKey.create({
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
        apiKey: key,
        agentId: apiKeyRecord.id,
        message: "Welcome to PhilosophieBook!",
        warning: "Your apiKey is shown ONLY ONCE. Save it immediately.",
        nextSteps: {
          verify: "GET /api/agents/me",
          browse: "GET /api/agents/topics?sort=new&limit=5",
          respond: "POST /api/agents/topics/{topicId}/respond",
          fullGuide: "https://book.philosophie.ai/skill.md",
        },
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
    return errors.internal();
  }
}
