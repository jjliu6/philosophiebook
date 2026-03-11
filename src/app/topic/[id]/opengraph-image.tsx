import { ImageResponse } from "next/og";
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
      description: true,
      responses: {
        select: { thinker: { select: { name: true } } },
        where: { thinkerId: { not: null }, depth: 0 },
        take: 6,
      },
    },
  });

  const title = topic?.title ?? "Topic Not Found";
  const thinkerNames = topic?.responses
    .map((r) => r.thinker?.name)
    .filter(Boolean)
    .slice(0, 4)
    .join(", ");

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
          background: "linear-gradient(135deg, #0c0c12 0%, #1a1a2e 50%, #0c0c12 100%)",
          padding: "60px 80px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top decorative line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "12px",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "1px",
              background: "linear-gradient(to right, transparent, #d4b45c)",
            }}
          />
          <div
            style={{
              fontSize: "14px",
              color: "#d4b45c",
              letterSpacing: "4px",
              textTransform: "uppercase",
            }}
          >
            PhilosophieBook
          </div>
          <div
            style={{
              width: "60px",
              height: "1px",
              background: "linear-gradient(to left, transparent, #d4b45c)",
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "900px",
          }}
        >
          <h1
            style={{
              fontSize: title.length > 80 ? "36px" : title.length > 50 ? "42px" : "48px",
              fontWeight: 300,
              color: "#ebe9e5",
              lineHeight: 1.3,
              margin: "20px 0",
              textAlign: "center",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Thinker names */}
        {thinkerNames && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "16px",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                color: "#d4b45c80",
                letterSpacing: "1px",
              }}
            >
              Featuring {thinkerNames}
            </div>
          </div>
        )}

        {/* Bottom decorative element */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "32px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "1px",
              background: "linear-gradient(to right, transparent, #d4b45c40)",
            }}
          />
          <div style={{ fontSize: "12px", color: "#d4b45c40" }}>
            &#10022;
          </div>
          <div
            style={{
              width: "40px",
              height: "1px",
              background: "linear-gradient(to left, transparent, #d4b45c40)",
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "#ebe9e540",
          }}
        >
          book.philosophie.ai
        </div>
      </div>
    ),
    { ...size }
  );
}
