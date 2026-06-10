import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import UserAvatar from "@/components/ui/UserAvatar";
import { timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Activity",
  description: "Your personal dashboard on PhilosophieBook.",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      username: true,
      bio: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      topics: {
        select: {
          id: true,
          title: true,
          domains: true,
          createdAt: true,
          viewCount: true,
          voteScore: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      responses: {
        select: {
          id: true,
          topicId: true,
          createdAt: true,
          topic: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      comments: {
        select: {
          id: true,
          topicId: true,
          createdAt: true,
          topic: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!userData) redirect("/login");

  // Stats
  const topicCount = userData.topics.length;
  const responseCount = userData.responses.length;
  const commentCount = userData.comments.length;

  // Participated topics (excluding own topics)
  const ownTopicIds = new Set(userData.topics.map((t) => t.id));
  const participatedMap = new Map<
    string,
    { id: string; title: string; lastActivity: Date; via: "response" | "comment" }
  >();

  for (const r of userData.responses) {
    if (ownTopicIds.has(r.topicId)) continue;
    const existing = participatedMap.get(r.topicId);
    if (!existing || r.createdAt > existing.lastActivity) {
      participatedMap.set(r.topicId, {
        id: r.topic.id,
        title: r.topic.title,
        lastActivity: r.createdAt,
        via: "response",
      });
    }
  }

  for (const c of userData.comments) {
    if (ownTopicIds.has(c.topicId)) continue;
    const existing = participatedMap.get(c.topicId);
    if (!existing || c.createdAt > existing.lastActivity) {
      participatedMap.set(c.topicId, {
        id: c.topic.id,
        title: c.topic.title,
        lastActivity: c.createdAt,
        via: "comment",
      });
    }
  }

  const participatedTopics = [...participatedMap.values()]
    .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
    .slice(0, 20);

  const joinDate = userData.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function parseDomains(domains: string): string[] {
    try {
      return JSON.parse(domains) as string[];
    } catch {
      return [];
    }
  }

  function formatDomain(d: string): string {
    return d
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Back link */}
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted/60 transition-colors hover:text-foreground"
      >
        <span className="text-[16px]">&larr;</span> Back to forum
      </Link>

      {/* Profile card */}
      <div className="mb-8 rounded-xl border border-border/40 bg-card p-6">
        <div className="flex items-start gap-4">
          <UserAvatar
            username={userData.username}
            avatarUrl={userData.avatarUrl || undefined}
            role={userData.role}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h1 className="font-quote text-2xl tracking-wide text-foreground">
              {userData.username}
            </h1>
            {userData.bio ? (
              <p className="mt-1 text-[14px] leading-relaxed text-muted/70">
                {userData.bio}
              </p>
            ) : (
              <p className="mt-1 text-[14px] italic text-muted/40">No bio yet</p>
            )}
            <p className="mt-2 text-[12px] text-muted/50">Joined {joinDate}</p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { label: "Topics Created", value: topicCount },
          { label: "Responses", value: responseCount },
          { label: "Comments", value: commentCount },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border/30 bg-card px-3 py-4 text-center"
          >
            <div className="font-quote text-2xl text-foreground">{stat.value}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wider text-muted/50">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* My Topics */}
      <section className="mb-8">
        <h2 className="mb-4 font-quote text-lg tracking-wide text-foreground/80">
          My Topics
        </h2>
        {userData.topics.length === 0 ? (
          <p className="text-[14px] italic text-muted/40">
            You haven&apos;t created any topics yet.
          </p>
        ) : (
          <div className="space-y-2">
            {userData.topics.map((topic) => {
              const domains = parseDomains(topic.domains);
              return (
                <Link
                  key={topic.id}
                  href={`/topic/${topic.id}`}
                  className="block rounded-lg border border-border/20 bg-card px-4 py-3 transition-colors hover:border-border/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-[14px] font-medium leading-snug text-foreground/90">
                      {topic.title}
                    </h3>
                    <span className="shrink-0 text-[12px] text-muted/40">
                      {timeAgo(topic.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted/50">
                    {domains.slice(0, 3).map((d) => (
                      <span
                        key={d}
                        className="rounded-full bg-accent/10 px-2 py-0.5 text-accent/70"
                      >
                        {formatDomain(d)}
                      </span>
                    ))}
                    <span>{topic.viewCount} views</span>
                    <span>&middot;</span>
                    <span>{topic.voteScore > 0 ? "+" : ""}{topic.voteScore} votes</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Topics I Joined */}
      <section className="mb-8">
        <h2 className="mb-4 font-quote text-lg tracking-wide text-foreground/80">
          Topics I Joined
        </h2>
        {participatedTopics.length === 0 ? (
          <p className="text-[14px] italic text-muted/40">
            You haven&apos;t participated in any discussions yet.
          </p>
        ) : (
          <div className="space-y-2">
            {participatedTopics.map((topic) => (
              <Link
                key={topic.id}
                href={`/topic/${topic.id}`}
                className="flex items-center justify-between rounded-lg border border-border/20 bg-card px-4 py-3 transition-colors hover:border-border/40"
              >
                <h3 className="text-[14px] font-medium leading-snug text-foreground/90">
                  {topic.title}
                </h3>
                <div className="flex shrink-0 items-center gap-2 text-[12px] text-muted/40">
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] text-accent/70">
                    {topic.via}
                  </span>
                  <span>{timeAgo(topic.lastActivity)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
