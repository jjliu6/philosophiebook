import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getThinker } from "@/personas";
import ThinkerAvatar from "@/components/thinker/ThinkerAvatar";

export const dynamic = "force-dynamic";

interface ThinkerProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ThinkerProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const thinker = await prisma.thinker.findUnique({
    where: { id },
    select: { name: true, school: true, era: true, tagline: true },
  });

  if (!thinker) return { title: "Thinker Not Found" };

  const desc = thinker.tagline
    ? `${thinker.name} (${thinker.school}, ${thinker.era}) — "${thinker.tagline.slice(0, 100)}"`
    : `${thinker.name} — ${thinker.school} philosopher (${thinker.era}) on PhilosophieBook.`;

  return {
    title: `${thinker.name} — ${thinker.school}`,
    description: desc,
    openGraph: {
      title: `${thinker.name} — ${thinker.school}`,
      description: desc,
      type: "profile",
      url: `https://book.philosophie.ai/thinkers/${id}`,
      siteName: "PhilosophieBook",
    },
    twitter: {
      card: "summary_large_image",
      title: `${thinker.name} — ${thinker.school}`,
      description: desc,
    },
  };
}

export default async function ThinkerProfilePage({
  params,
}: ThinkerProfilePageProps) {
  const { id } = await params;

  let thinker;
  try {
    thinker = await prisma.thinker.findUnique({
      where: { id },
      include: {
        responses: {
          include: {
            topic: {
              select: {
                id: true,
                title: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch thinker:", error);
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-quote text-2xl text-foreground">
          Error loading thinker
        </h1>
        <p className="mt-3 text-sm italic text-muted/60">
          Something went wrong. Please try again later.
        </p>
        <Link
          href="/thinkers"
          className="mt-4 inline-block text-sm text-accent/70 transition-colors hover:text-accent"
        >
          &larr; Back to thinkers
        </Link>
      </div>
    );
  }

  if (!thinker) {
    notFound();
  }

  // Get persona data for key concepts and relationships
  const persona = getThinker(id);

  // Get unique topics this thinker participated in
  const recentTopics = thinker.responses.reduce(
    (acc, r) => {
      if (!acc.find((t) => t.id === r.topic.id)) {
        acc.push(r.topic);
      }
      return acc;
    },
    [] as { id: string; title: string; createdAt: Date }[]
  );

  // Parse topicDomains from DB
  let domains: string[] = [];
  try {
    domains = JSON.parse(thinker.topicDomains);
  } catch {
    domains = [];
  }

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: thinker.name,
    description: thinker.tagline || `${thinker.school} philosopher`,
    knowsAbout: thinker.school,
    url: `https://book.philosophie.ai/thinkers/${id}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://book.philosophie.ai" },
      { "@type": "ListItem", position: 2, name: "Thinkers", item: "https://book.philosophie.ai/thinkers" },
      { "@type": "ListItem", position: 3, name: thinker.name, item: `https://book.philosophie.ai/thinkers/${id}` },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Breadcrumb */}
      <Link
        href="/thinkers"
        className="mb-8 inline-block text-[13px] tracking-wide text-muted/50 transition-colors hover:text-foreground/70"
      >
        &larr; Back to thinkers
      </Link>

      {/* Banner — book-style page */}
      <div className="book-page page-corner relative overflow-hidden rounded-xl border border-border/40">
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            background: `radial-gradient(ellipse at top left, ${thinker.color}, transparent 70%)`,
          }}
        />
        <div className="relative p-8 sm:p-10">
          <div className="flex items-center gap-6">
            <ThinkerAvatar
              name={thinker.name}
              color={thinker.color}
              thinkerId={thinker.id}
              size="lg"
            />
            <div>
              <h1 className="font-quote text-3xl font-light text-foreground sm:text-4xl">
                {thinker.name}
              </h1>
              {thinker.chineseName && (
                <p className="mt-1 text-lg text-muted/50">{thinker.chineseName}</p>
              )}
              <p className="mt-2 text-[13px] tracking-wide text-muted/50">
                {thinker.school} &middot; {thinker.era}
              </p>
            </div>
          </div>

          {/* Tagline — book-style quotation */}
          {thinker.tagline && (
            <blockquote className="book-quote mt-6">
              <p className="font-quote text-lg italic leading-relaxed text-foreground/50">
                {thinker.tagline}
              </p>
            </blockquote>
          )}
        </div>

        {/* Subtle bottom line */}
        <div
          className="h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${thinker.color}40, transparent)`,
          }}
        />

        {/* Content sections */}
        <div className="p-8 sm:p-10">
          {/* Topic Domains */}
          {domains.length > 0 && (
            <div className="mb-10">
              <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-accent/60">
                Areas of Expertise
              </h2>
              <div className="flex flex-wrap gap-2">
                {domains.map((domain) => (
                  <span
                    key={domain}
                    className="text-[12px] lowercase tracking-wide text-muted/50"
                    style={{
                      color: `${thinker.color}99`,
                    }}
                  >
                    {domain.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key Concepts */}
          <div className="mb-10">
            <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-accent/60">
              Key Concepts
            </h2>
            {persona?.keyConcepts && persona.keyConcepts.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {persona.keyConcepts.map((concept) => (
                  <span
                    key={concept}
                    className="rounded-lg border border-border/40 bg-input-bg px-3.5 py-1.5 text-[13px] text-foreground/60"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-muted/40">
                Key concepts will be available soon.
              </p>
            )}
          </div>

          {/* Divider — fleuron style */}
          <div className="fleuron mb-6">
            <span className="text-[8px] text-accent/25">&#10022;</span>
          </div>

          {/* Recent Discussions */}
          <div className="mb-10">
            <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-accent/60">
              Recent Discussions
            </h2>
            {recentTopics.length > 0 ? (
              <div className="space-y-1">
                {recentTopics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topic/${topic.id}`}
                    className="block rounded-lg px-4 py-3 text-[14px] text-foreground/70 transition-all duration-300 hover:bg-input-bg hover:text-foreground"
                  >
                    {topic.title}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-muted/40">
                No discussions yet.
              </p>
            )}
          </div>

          {/* Divider — fleuron style */}
          <div className="fleuron mb-6">
            <span className="text-[8px] text-accent/25">&#10022;</span>
          </div>

          {/* Relationships */}
          <div>
            <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-accent/60">
              Relationships
            </h2>
            {persona?.relationships && persona.relationships.length > 0 ? (
              <div className="space-y-4">
                {persona.relationships.map((rel) => {
                  const typeColors: Record<string, string> = {
                    ally: "var(--color-human)",
                    rival: "var(--color-news)",
                    opponent: "var(--color-liked)",
                    dialogue: "var(--color-agent)",
                    complex: "var(--color-agent)",
                  };
                  return (
                    <div
                      key={rel.targetThinkerId}
                      className="rounded-lg border border-border/30 bg-input-bg px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/thinkers/${rel.targetThinkerId}`}
                          className="font-quote text-[15px] text-foreground/80 transition-colors hover:text-accent"
                        >
                          {rel.targetThinkerId.charAt(0).toUpperCase() +
                            rel.targetThinkerId.slice(1)}
                        </Link>
                        <span
                          className="text-[11px] italic tracking-wide"
                          style={{ color: typeColors[rel.type] || undefined }}
                        >
                          {rel.type}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted/50">
                        {rel.dynamic}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm italic text-muted/40">
                Relationship data will be available soon.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
