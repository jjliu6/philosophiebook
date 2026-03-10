import Link from "next/link";
import ThinkerAvatar from "@/components/thinker/ThinkerAvatar";
import { timeAgo } from "@/lib/utils";

/** Generate a consistent color from a string */
function stringToColor(str: string): string {
  const colors = [
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
    "#ec4899", "#f43f5e", "#ef4444", "#f97316",
    "#eab308", "#84cc16", "#22c55e", "#14b8a6",
    "#06b6d4", "#0ea5e9", "#3b82f6",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface TopicCardProps {
  topic: {
    id: string;
    title: string;
    description: string | null;
    domains: string;
    createdAt: Date;
    responseCount: number;
    totalLikes: number;
    totalEndorsements: number;
    commentCount?: number;
    responses: {
      thinker: {
        id: string;
        name: string;
        color: string;
        school: string;
      };
    }[];
    humanParticipants?: {
      id: string;
      username: string;
    }[];
  };
  /** Index in the feed list (for folio display) */
  index?: number;
}

export default function TopicCard({ topic, index }: TopicCardProps) {
  // Get unique thinkers from responses
  const uniqueThinkers = topic.responses.reduce(
    (acc, r) => {
      if (!acc.find((t) => t.id === r.thinker.id)) {
        acc.push(r.thinker);
      }
      return acc;
    },
    [] as { id: string; name: string; color: string; school: string }[]
  );

  const humanParticipants = topic.humanParticipants || [];

  // Parse domain tags
  let domains: string[] = [];
  try {
    domains = JSON.parse(topic.domains);
  } catch {
    domains = [];
  }

  return (
    <Link href={`/topic/${topic.id}`} className="group block">
      <article className="page-lift book-page relative overflow-hidden rounded-xl border border-border/40 p-6 transition-all duration-300 group-hover:border-border/70">
        {/* Folio number in top-right corner */}
        {typeof index === "number" && (
          <span className="folio absolute right-5 top-4">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}

        {/* Domain tags — subtle, above the title */}
        {domains.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {domains.map((domain) => (
              <span
                key={domain}
                className="text-[11px] lowercase tracking-wide text-muted/60"
              >
                {domain.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        {/* Title — serif, like a chapter heading */}
        <h3 className="font-quote text-xl font-normal leading-snug text-foreground/90 transition-colors duration-300 group-hover:text-foreground">
          {topic.title}
        </h3>

        {/* Description snippet */}
        {topic.description && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted/70">
            {topic.description}
          </p>
        )}

        {/* Participants row — AI thinkers + Human users */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          {/* AI Thinkers */}
          {uniqueThinkers.length > 0 && (
            <div className="flex items-center gap-1.5">
              {uniqueThinkers.map((thinker) => (
                <ThinkerAvatar
                  key={thinker.id}
                  name={thinker.name}
                  color={thinker.color}
                  thinkerId={thinker.id}
                  size="sm"
                />
              ))}
              <span className="ml-1 text-xs text-muted/50">
                {uniqueThinkers.length} AI
              </span>
            </div>
          )}

          {/* Human Participants */}
          {humanParticipants.length > 0 && (
            <div className="flex items-center gap-1">
              {humanParticipants.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-green-500/20 text-[11px] font-medium text-white"
                  style={{ backgroundColor: stringToColor(user.username) }}
                  title={user.username}
                >
                  {user.username[0].toUpperCase()}
                </div>
              ))}
              {humanParticipants.length > 5 && (
                <span className="ml-1 text-[11px] text-muted/40">
                  +{humanParticipants.length - 5}
                </span>
              )}
              <span className="ml-1 text-xs text-muted/50">
                {humanParticipants.length} human{humanParticipants.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Stats and meta — dot-separated */}
        <div className="mt-4 flex flex-wrap items-center gap-x-1.5 text-[12px] text-muted/50">
          <span>{topic.responseCount} responses</span>
          {(topic.commentCount ?? 0) > 0 && (
            <>
              <span>&middot;</span>
              <span>{topic.commentCount} comments</span>
            </>
          )}
          <span>&middot;</span>
          <span>{topic.totalLikes} likes</span>
          <span>&middot;</span>
          <span>{timeAgo(new Date(topic.createdAt))}</span>
        </div>
      </article>
    </Link>
  );
}
