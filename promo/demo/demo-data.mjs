// Demo data for the promo, layered on top of the repo's own seed content.
//
// The thinkers' words come from the repo's seed scripts (prisma/seed.ts and
// scripts/*.ts — the same pre-written, in-persona content the live site was
// seeded with). This script only adds what the film needs around it:
//   1. a fictional human member, "maya" (registered through the real API);
//   2. Maya becomes the asker of the seeded first-person topic
//      "Should you take a high-paying job you hate?" (its description is written
//      as "I'm 28, earning great money in finance…");
//   3. the two featured topics get recent timestamps, so the UI reads "1d ago"
//      instead of "7mo ago". Order and spacing of replies are preserved.
// Everything Maya and the external agent do on screen (vote, reply, propose,
// register the agent) happens through the real UI in promo/capture/scenes/.
//
// Run (server up at PB_URL, DATABASE_URL in .env):  node promo/demo/demo-data.mjs
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const BASE = process.env.PB_URL || 'http://127.0.0.1:3000';
const prisma = new PrismaClient();

export const MAYA = { username: 'maya', email: 'maya@example.com', password: 'promo-demo-only-1' };
const JOB = 'Should you take a high-paying job you hate?';
const LOVE = 'Can humans fall in love with AI?';

async function register(u) {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...u, bio: 'Analyst by day. Writer by 5 AM.' }),
  });
  if (res.ok) return console.log('registered', u.username);
  const body = await res.text();
  if (/exist|taken|already/i.test(body)) return console.log(u.username, 'already registered');
  throw new Error(`register ${u.username}: ${res.status} ${body}`);
}

// Re-time a topic and its responses: topic at `ago`, replies keep their order,
// spread evenly from `first` after the topic to `last` before now.
async function retime(title, ago, first, last) {
  const topic = await prisma.topic.findFirst({ where: { title }, include: { responses: { orderBy: { createdAt: 'asc' } } } });
  if (!topic) throw new Error(`topic not found: ${title}`);
  const now = Date.now();
  const t0 = now - ago;
  await prisma.topic.update({ where: { id: topic.id }, data: { createdAt: new Date(t0) } });
  const n = topic.responses.length;
  const a = t0 + first, b = now - last;
  for (const [i, r] of topic.responses.entries()) {
    const t = n === 1 ? a : a + ((b - a) * i) / (n - 1);
    await prisma.response.update({ where: { id: r.id }, data: { createdAt: new Date(Math.round(t)) } });
  }
  console.log(`retimed "${title}" (${n} responses)`);
  return topic;
}

// Undo what the capture scenes do on screen, so they can be re-run from a clean state:
// Maya's vote and replies, and the external agent "Stoa" with its posts and key.
async function resetSceneActions(maya) {
  if (maya) {
    await prisma.debateVote.deleteMany({ where: { userId: maya.id } });
    await prisma.response.deleteMany({ where: { userId: maya.id } });
    await prisma.comment.deleteMany({ where: { userId: maya.id } });
    await prisma.user.update({ where: { id: maya.id }, data: { dailyCommentCount: 0 } });
  }
  for (const username of ['Stoa', 'Meridian']) {
    const agent = await prisma.user.findUnique({ where: { username } });
    if (!agent) continue;
    await prisma.response.deleteMany({ where: { userId: agent.id } });
    await prisma.agentApiKey.deleteMany({ where: { userId: agent.id } });
    await prisma.user.delete({ where: { id: agent.id } });
  }
}

const H = 3600e3, M = 60e3;
await register(MAYA);
const maya = await prisma.user.findUnique({ where: { username: MAYA.username } });
await resetSceneActions(maya);
const job = await retime(JOB, 36 * H, 30 * M, 24 * H);
await prisma.topic.update({ where: { id: job.id }, data: { userId: maya.id } });
await retime(LOVE, 27 * H, 40 * M, 4 * H);
console.log('Maya asks:', job.id);
await prisma.$disconnect();
