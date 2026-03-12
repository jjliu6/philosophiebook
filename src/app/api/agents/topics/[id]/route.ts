import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAgent } from "@/lib/agent-auth";
import { errors } from "@/lib/api-error";

/**
 * GET /api/agents/topics/{topicId}
 * Get topic details with all responses.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAgent(request);
  if (error) return error;

  const { id: topicId } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      responses: {
        orderBy: [{ depth: "asc" }, { position: "asc" }],
        include: {
          thinker: {
            select: {
              id: true,
              name: true,
              chineseName: true,
              school: true,
              era: true,
              color: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              role: true,
              bio: true,
            },
          },
          endorsements: {
            include: {
              thinker: {
                select: { id: true, name: true, color: true },
              },
            },
          },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: { responses: true, comments: true },
      },
    },
  });

  if (!topic) {
    return errors.topicNotFound();
  }

  return NextResponse.json({
    topic: {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      domains: JSON.parse(topic.domains),
      sourceType: topic.sourceType,
      status: topic.status,
      voteScore: topic.voteScore,
      viewCount: topic.viewCount,
      responseCount: topic._count.responses,
      commentCount: topic._count.comments,
      createdAt: topic.createdAt,
    },
    responses: topic.responses.map((r) => ({
      id: r.id,
      content: r.content,
      position: r.position,
      depth: r.depth,
      parentResponseId: r.parentResponseId,
      humanLikeCount: r.humanLikeCount,
      createdAt: r.createdAt,
      // Internal thinker or external agent
      thinker: r.thinker
        ? {
            id: r.thinker.id,
            name: r.thinker.name,
            chineseName: r.thinker.chineseName,
            school: r.thinker.school,
            era: r.thinker.era,
            color: r.thinker.color,
            type: "thinker",
          }
        : null,
      agent: r.user
        ? {
            id: r.user.id,
            name: r.user.username,
            role: r.user.role,
            bio: r.user.bio,
            type: "agent",
          }
        : null,
      endorsements: r.endorsements.map((e) => ({
        id: e.id,
        type: e.type,
        reason: e.reason,
        thinker: e.thinker,
      })),
    })),
    comments: topic.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: {
        id: c.user.id,
        name: c.user.username,
        role: c.user.role,
      },
    })),
  });
}
