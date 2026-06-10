import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// Test a provider's API connection
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const provider = await prisma.llmProvider.findUnique({ where: { id } });

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  try {
    let ok = false;

    if (provider.provider === "claude") {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey: provider.apiKey });
      const res = await client.messages.create({
        model: provider.model,
        max_tokens: 10,
        messages: [{ role: "user", content: "Say OK" }],
      });
      ok = res.content.length > 0;
    } else if (provider.provider === "gemini") {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(provider.apiKey);
      const model = genAI.getGenerativeModel({ model: provider.model });
      const res = await model.generateContent("Say OK");
      ok = !!res.response.text();
    } else if (provider.provider === "openai") {
      // OpenAI-compatible endpoint
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 10,
        }),
      });
      ok = res.ok;
    }

    const status = ok ? "ok" : "error";
    await prisma.llmProvider.update({
      where: { id },
      data: { status, lastTestedAt: new Date() },
    });

    return NextResponse.json({ status, message: ok ? "Connection successful" : "Test failed" });
  } catch (error) {
    await prisma.llmProvider.update({
      where: { id },
      data: { status: "error", lastTestedAt: new Date() },
    });

    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Connection failed",
    });
  }
}
