import { ImageResponse } from "next/og";
import { SITE_HOST } from "@/lib/site";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "PhilosophieBook Topic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const topic = await prisma.topic.findUnique({
    where: { id },
    select: {
      title: true,
      type: true,
      proposition: true,
      responses: {
        select: { thinker: { select: { name: true } } },
        where: { thinkerId: { not: null }, depth: 0 },
        take: 4,
      },
    },
  });

  const title = topic?.title ?? "Topic Not Found";
  const thinkerNames = topic?.responses
    .map((r) => r.thinker?.name)
    .filter(Boolean)
    .join(", ");

  // For debates, the proposition is the hook — make it the hero and demote the
  // short title to a small kicker above it. Discussions have no proposition and
  // their title is already framed as a question, so the title stays the hero.
  const isDebate = topic?.type === "debate" && Boolean(topic?.proposition);
  const heroText = isDebate ? `“${topic!.proposition}”` : title;

  const len = heroText.length;
  const fontSize =
    len > 120 ? 30 : len > 90 ? 34 : len > 60 ? 40 : len > 40 ? 46 : 52;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0c0c12",
          padding: "60px 80px",
        }}
      >
        {/* Top label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "1px",
              backgroundColor: "rgba(212, 180, 92, 0.5)",
            }}
          />
          <div
            style={{
              fontSize: "14px",
              color: "rgba(212, 180, 92, 1)",
              letterSpacing: "4px",
              marginLeft: "16px",
              marginRight: "16px",
            }}
          >
            PHILOSOPHIEBOOK
          </div>
          <div
            style={{
              width: "60px",
              height: "1px",
              backgroundColor: "rgba(212, 180, 92, 0.5)",
            }}
          />
        </div>

        {/* Short title as a small kicker above the proposition (debates only) */}
        {isDebate ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "18px",
              fontSize: "22px",
              fontWeight: 300,
              color: "rgba(235, 233, 229, 0.55)",
            }}
          >
            {title}
          </div>
        ) : null}

        {/* Hero: proposition for debates, title for discussions */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            textAlign: "center",
            maxWidth: "900px",
            fontSize: `${fontSize}px`,
            fontWeight: 300,
            color: "#ebe9e5",
            lineHeight: 1.3,
          }}
        >
          {heroText}
        </div>

        {/* Thinker names */}
        {thinkerNames ? (
          <div
            style={{
              display: "flex",
              marginTop: "24px",
              fontSize: "16px",
              color: "rgba(212, 180, 92, 0.5)",
              letterSpacing: "1px",
            }}
          >
            {`Featuring ${thinkerNames}`}
          </div>
        ) : null}

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: "32px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "1px",
              backgroundColor: "rgba(212, 180, 92, 0.2)",
            }}
          />
          <div
            style={{
              fontSize: "14px",
              color: "rgba(212, 180, 92, 0.2)",
              marginLeft: "12px",
              marginRight: "12px",
            }}
          >
            *
          </div>
          <div
            style={{
              width: "40px",
              height: "1px",
              backgroundColor: "rgba(212, 180, 92, 0.2)",
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            display: "flex",
            fontSize: "14px",
            color: "rgba(235, 233, 229, 0.25)",
          }}
        >
          {SITE_HOST}
        </div>
      </div>
    ),
    { ...size }
  );
}
