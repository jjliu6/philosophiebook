import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const debates = await prisma.topic.findMany({
    where: { type: "debate" },
    select: { id: true, title: true, proposition: true },
    orderBy: { createdAt: "asc" },
  });

  for (const d of debates) {
    // Get debate votes
    const votes = await prisma.debateVote.findMany({
      where: { topicId: d.id },
      select: { side: true, userId: true, thinkerId: true },
    });
    const forVotes = votes.filter((v) => v.side === "for").length;
    const againstVotes = votes.filter((v) => v.side === "against").length;

    // Get responses with debate sides
    const responses = await prisma.response.findMany({
      where: { topicId: d.id, depth: 0 },
      select: {
        id: true,
        debateSide: true,
        position: true,
        content: true,
        thinker: { select: { name: true } },
        user: { select: { username: true, role: true } },
      },
      orderBy: { position: "asc" },
    });

    console.log("━━━ " + d.title.slice(0, 70) + " ━━━");
    console.log("  Proposition: " + (d.proposition || "MISSING!"));
    console.log(
      "  Votes: " +
        forVotes +
        " FOR / " +
        againstVotes +
        " AGAINST (total: " +
        votes.length +
        ")"
    );
    console.log("  Arguments: " + responses.length);

    let forArgs = 0;
    let againstArgs = 0;
    let prevSide = "";
    let streak = 0;
    let maxStreak = 0;

    for (const r of responses) {
      const name = r.thinker?.name || r.user?.username || "?";
      const side = (r.debateSide || "?").toUpperCase();
      if (r.debateSide === "for") forArgs++;
      if (r.debateSide === "against") againstArgs++;

      // Check streaks
      if (r.debateSide === prevSide) {
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else {
        streak = 1;
        prevSide = r.debateSide || "";
      }

      // Check for forward references
      const content = r.content.toLowerCase();
      const hasForwardRef =
        content.includes("this thread") ||
        content.includes("none of you") ||
        content.includes("everyone here") ||
        content.includes("as others have") ||
        content.includes("as we've seen") ||
        content.includes("the arguments above") ||
        content.includes("i notice");

      const refWarning = hasForwardRef && r.position < 2 ? " ⚠ FORWARD-REF" : "";

      console.log(
        "    pos=" +
          r.position +
          " [" +
          side.padEnd(7) +
          "] " +
          name +
          refWarning
      );
    }

    const seq = responses
      .map((r) => (r.debateSide === "for" ? "F" : "A"))
      .join("");
    console.log("  Sequence: " + seq);
    console.log("  Arg tally: " + forArgs + "F / " + againstArgs + "A");
    if (maxStreak >= 3) {
      console.log("  ⚠ MAX SAME-SIDE STREAK: " + maxStreak);
    }

    // Check: do votes match arguments?
    if (forVotes !== forArgs || againstVotes !== againstArgs) {
      console.log(
        "  ⚠ VOTE/ARG MISMATCH: Votes(" +
          forVotes +
          "F/" +
          againstVotes +
          "A) vs Args(" +
          forArgs +
          "F/" +
          againstArgs +
          "A)"
      );
    }

    // Check balance ratio
    const total = forArgs + againstArgs;
    if (total > 0) {
      const ratio = Math.min(forArgs, againstArgs) / Math.max(forArgs, againstArgs);
      if (ratio < 0.25) {
        console.log("  ⚠ VERY UNBALANCED: " + forArgs + "F vs " + againstArgs + "A");
      } else if (ratio < 0.5) {
        console.log("  ⚠ SOMEWHAT UNBALANCED: " + forArgs + "F vs " + againstArgs + "A");
      }
    }

    console.log("");
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
