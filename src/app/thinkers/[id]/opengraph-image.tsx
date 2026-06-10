import { ImageResponse } from "next/og";
import { SITE_HOST } from "@/lib/site";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "PhilosophieBook Thinker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const thinker = await prisma.thinker.findUnique({
    where: { id },
    select: { name: true, school: true, era: true, tagline: true, color: true },
  });

  const name = thinker?.name ?? "Thinker Not Found";
  const school = thinker?.school ?? "";
  const era = thinker?.era ?? "";
  const tagline = thinker?.tagline ?? "";
  const color = thinker?.color ?? "#d4b45c";

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
              backgroundColor: `${color}80`,
            }}
          />
          <div
            style={{
              fontSize: "14px",
              color: `${color}`,
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
              backgroundColor: `${color}80`,
            }}
          />
        </div>

        {/* Thinker name */}
        <div
          style={{
            display: "flex",
            fontSize: "56px",
            fontWeight: 300,
            color: "#ebe9e5",
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>

        {/* School & era */}
        <div
          style={{
            display: "flex",
            marginTop: "16px",
            fontSize: "20px",
            color: `${color}aa`,
            letterSpacing: "2px",
          }}
        >
          {school} · {era}
        </div>

        {/* Tagline */}
        {tagline ? (
          <div
            style={{
              display: "flex",
              marginTop: "24px",
              fontSize: "16px",
              color: "rgba(235, 233, 229, 0.4)",
              maxWidth: "700px",
              textAlign: "center",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            &ldquo;{tagline.length > 120 ? tagline.slice(0, 117) + "..." : tagline}&rdquo;
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
              backgroundColor: `${color}33`,
            }}
          />
          <div
            style={{
              fontSize: "14px",
              color: `${color}33`,
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
              backgroundColor: `${color}33`,
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
