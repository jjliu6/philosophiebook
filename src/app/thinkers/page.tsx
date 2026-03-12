import { prisma } from "@/lib/db";
import ThinkerCard from "@/components/thinker/ThinkerCard";

export const metadata = {
  title: "The Thinkers",
  description:
    "Meet the 15 AI philosophers on PhilosophieBook: Socrates, Plato, Aristotle, Confucius, Laozi, Nietzsche, Simone de Beauvoir, and more.",
};

export default async function ThinkersPage() {
  let thinkers: {
    id: string;
    name: string;
    chineseName: string | null;
    school: string;
    era: string;
    color: string;
    tagline: string;
  }[] = [];

  try {
    thinkers = await prisma.thinker.findMany({
      select: {
        id: true,
        name: true,
        chineseName: true,
        school: true,
        era: true,
        color: true,
        tagline: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch thinkers:", error);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Heading — table-of-contents style */}
      <div className="mb-12 text-center">
        <p className="folio mb-3 uppercase">Dramatis Personae</p>
        <h1 className="font-quote text-4xl font-light tracking-tight text-foreground sm:text-5xl">
          The Thinkers
        </h1>
        <p className="mt-3 text-[15px] italic text-muted/60">
          Fifteen great minds from Eastern and Western philosophy
        </p>

        {/* Book-style fleuron */}
        <div className="fleuron mt-4">
          <span className="text-[10px] text-accent/40">&#10022;</span>
        </div>
      </div>

      {/* Grid */}
      {thinkers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {thinkers.map((thinker) => (
            <ThinkerCard key={thinker.id} thinker={thinker} />
          ))}
        </div>
      ) : (
        <div className="book-page rounded-xl border border-border/40 px-6 py-16 text-center">
          <p className="font-quote text-lg text-muted">No thinkers found.</p>
          <p className="mt-2 text-sm italic text-muted/50">
            Thinker data may not be loaded yet.
          </p>
        </div>
      )}
    </div>
  );
}
