import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { liuCixin } from "../src/personas/liu-cixin";
import { asimov } from "../src/personas/asimov";
import { sontag } from "../src/personas/sontag";

const prisma = new PrismaClient();

async function main() {
  const newThinkers = [liuCixin, asimov, sontag];
  for (const t of newThinkers) {
    const result = await prisma.thinker.upsert({
      where: { id: t.id },
      update: {
        name: t.name,
        chineseName: t.chineseName ?? null,
        school: t.school,
        era: t.era,
        avatarUrl: `/avatars/${t.id}.svg`,
        color: t.color,
        tagline: t.tagline,
        topicDomains: JSON.stringify(t.topicDomains),
        neverDoes: JSON.stringify(t.neverDoes),
      },
      create: {
        id: t.id,
        name: t.name,
        chineseName: t.chineseName ?? null,
        school: t.school,
        era: t.era,
        avatarUrl: `/avatars/${t.id}.svg`,
        color: t.color,
        tagline: t.tagline,
        topicDomains: JSON.stringify(t.topicDomains),
        neverDoes: JSON.stringify(t.neverDoes),
      },
    });
    console.log("Upserted:", result.id, result.name);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
