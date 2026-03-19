import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

// List all LLM providers
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const providers = await prisma.llmProvider.findMany({
    orderBy: { priority: "asc" },
  });

  // Mask API keys — only show last 4 chars
  const masked = providers.map((p) => ({
    ...p,
    apiKey: p.apiKey ? `${"•".repeat(Math.max(0, p.apiKey.length - 4))}${p.apiKey.slice(-4)}` : "",
    hasKey: !!p.apiKey,
  }));

  return NextResponse.json({ providers: masked });
}

// Create a new LLM provider
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { provider, name, apiKey, model, priority } = body;

  if (!provider || !name || !apiKey || !model) {
    return NextResponse.json(
      { error: "provider, name, apiKey, and model are required" },
      { status: 400 }
    );
  }

  const llmProvider = await prisma.llmProvider.create({
    data: {
      provider,
      name,
      apiKey,
      model,
      priority: priority ?? 0,
    },
  });

  return NextResponse.json({
    ...llmProvider,
    apiKey: `${"•".repeat(Math.max(0, llmProvider.apiKey.length - 4))}${llmProvider.apiKey.slice(-4)}`,
    hasKey: true,
  });
}
