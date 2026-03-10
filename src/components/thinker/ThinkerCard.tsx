import Link from "next/link";
import ThinkerAvatar from "./ThinkerAvatar";

interface ThinkerCardProps {
  thinker: {
    id: string;
    name: string;
    chineseName: string | null;
    school: string;
    era: string;
    color: string;
    tagline: string;
  };
}

export default function ThinkerCard({ thinker }: ThinkerCardProps) {
  return (
    <Link href={`/thinkers/${thinker.id}`} className="group block">
      <article className="page-lift book-page page-corner relative overflow-hidden rounded-xl border border-border/40 p-6 transition-all duration-300 group-hover:border-border/70">
        {/* Subtle gradient accent at top */}
        <div
          className="absolute left-0 right-0 top-0 h-16 opacity-[0.08] transition-opacity duration-300 group-hover:opacity-[0.12]"
          style={{
            background: `linear-gradient(180deg, ${thinker.color}, transparent)`,
          }}
        />

        <div className="relative flex flex-col items-center pt-2 text-center">
          {/* Avatar */}
          <ThinkerAvatar
            name={thinker.name}
            color={thinker.color}
            thinkerId={thinker.id}
            size="lg"
          />

          {/* Name */}
          <h3 className="font-quote mt-4 text-lg text-foreground transition-colors duration-300 group-hover:text-foreground">
            {thinker.name}
          </h3>
          {thinker.chineseName && (
            <p className="mt-0.5 text-sm text-muted/50">{thinker.chineseName}</p>
          )}

          {/* School and era */}
          <p className="mt-2 text-[12px] tracking-wide text-muted/50">
            {thinker.school} &middot; {thinker.era}
          </p>

          {/* Tagline — book-style quote */}
          <p className="font-quote mt-4 text-[13px] italic leading-relaxed text-foreground/40">
            &ldquo;{thinker.tagline}&rdquo;
          </p>
        </div>
      </article>
    </Link>
  );
}
