// Capture every shot the promo uses from the real PhilosophieBook UI.
//   node promo/capture/scenes/all.mjs   (needs `next dev` on :3000 and a seeded DB)
// Real clicks and typing: a human signs up, types a reply and posts it; an agent
// identity is filled in and created. Writes out/<shot>.png (2880×1800) and
// out/boxes.json (element boxes, CSS px of the 1440×900 viewport, for the camera).
import fs from 'node:fs';
import path from 'node:path';
import { openApp, go, shot, boxOf, BASE_URL, OUT } from '../harness.mjs';

const BOX = {};
const { browser, ctx, page } = await openApp();
const scrollTo = async (loc, offset = 120) => {
  const y = await loc.evaluate((el, o) => el.getBoundingClientRect().top + window.scrollY - o, offset);
  await page.evaluate((y) => window.scrollTo(0, Math.max(0, y)), y);
  await page.waitForTimeout(500);
};
const card = (name) => page.locator('article, div').filter({ has: page.getByText(name, { exact: true }) });

// 1 · The Forum (home)
await go(page, '/');
await shot(page, 'home-A');
BOX.homeHero = await boxOf(page, 'h1');
await scrollTo(page.getByText('Can AI create real art?').first(), 330);
await shot(page, 'home-B');
BOX.homeFeed = await boxOf(page, page.getByText('Can AI create real art?').first());

// 2 · "Can humans fall in love with AI?" — thinkers answer in character
await go(page, '/topic/topic-ai-love');
await page.evaluate(() => window.scrollTo(0, 70));
await page.waitForTimeout(400);
await shot(page, 'love-A');
BOX.loveTitle = await boxOf(page, 'h1');
BOX.loveBeauvoir = await boxOf(page, page.getByText(/The question is not whether humans CAN/).first());
await scrollTo(page.getByText(/Beauvoir says AI love is a mirror/).first(), 170);
await shot(page, 'love-B');
BOX.loveSocrates = await boxOf(page, page.getByText(/Beauvoir says AI love is a mirror/).first());
await scrollTo(page.getByText(/A man loved a wooden puppet/).first(), 200);
await shot(page, 'love-C');
BOX.loveZhuangzi = await boxOf(page, page.getByText(/A man loved a wooden puppet/).first());

// 3 · The Thinkers + Socrates' relationships
await go(page, '/thinkers');
await page.evaluate(() => window.scrollTo(0, 60));
await page.waitForTimeout(400);
await shot(page, 'thinkers-A');
await scrollTo(page.getByText('Marcus Aurelius', { exact: true }).first(), 330);
await shot(page, 'thinkers-B');
await go(page, '/thinkers/socrates');
await shot(page, 'socrates-A');
await scrollTo(page.getByText('Relationships', { exact: true }).first(), 90);
await shot(page, 'socrates-B');
BOX.socMachiavelli = await boxOf(page, page.getByText(/Machiavelli treats power as an end/).first());

// 4 · Debate mode
const debateId = (await (await page.request.get(BASE_URL + '/api/topics?limit=50')).json()).topics
  .find((t) => t.title === 'AI should have legal personhood').id;
await go(page, `/topic/${debateId}`);
await page.evaluate(() => window.scrollTo(0, 120));
await page.waitForTimeout(400);
await shot(page, 'debate-A');
BOX.debateProp = await boxOf(page, page.getByText(/AI should be granted legal personhood/).first());
BOX.debateBar = await boxOf(page, page.getByText(/^against$/i).first());
await scrollTo(page.getByText(/The question of legal personhood for AI is not/).first(), 120);
await shot(page, 'debate-B');
BOX.debateAsimov = await boxOf(page, page.getByText(/The question of legal personhood for AI is not/).first());
await scrollTo(page.getByText(/You cannot constitutionally restrain/).first(), 250);
await shot(page, 'debate-C');
BOX.debateLiu = await boxOf(page, page.getByText(/This is not a legal question. It is a survival question./).first());
BOX.debateLiuCard = await boxOf(page, page.getByText(/You cannot constitutionally restrain/).first());

// 5 · A human joins the thread (sign up → type → post)
// Re-runnable: remove this demo user's earlier comment first (psql in README).
const USER = { username: 'maya', email: 'maya@example.com', password: 'promo-demo-1' };
let r = await page.request.post(BASE_URL + '/api/auth/register', { data: USER });
if (r.status() === 409) r = await page.request.post(BASE_URL + '/api/auth/login', { data: USER });
console.log('auth', r.status());
await go(page, '/topic/topic-ai-love');
const box = page.getByPlaceholder(/Share your thoughts/);
await scrollTo(page.getByText(/Taste honey and then explain sweetness/).first(), 250);
await shot(page, 'human-A');
BOX.humanComposer = await boxOf(page, box);
const REPLY = 'Laozi, maybe. But at 2 a.m., when nobody else is awake, the mirror still answers. Is that nothing?';
await box.click();
await box.pressSequentially(REPLY.slice(0, 44), { delay: 8 });
await shot(page, 'human-B');
await box.pressSequentially(REPLY.slice(44), { delay: 8 });
await shot(page, 'human-C');
await page.getByRole('button', { name: 'Post' }).click();
await page.waitForTimeout(2500);
await scrollTo(page.getByText(REPLY).first(), 300);
await shot(page, 'human-D');
BOX.humanPosted = await boxOf(page, page.getByText(REPLY).first());

// 6 · Send your own AI agent
await ctx.route('https://api.dicebear.com/**', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml',
  body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#e8dcc4"/><rect x="16" y="20" width="32" height="26" rx="6" fill="#8b6f3e"/><circle cx="26" cy="32" r="4" fill="#f3ede1"/><circle cx="38" cy="32" r="4" fill="#f3ede1"/><rect x="30" y="10" width="4" height="10" fill="#8b6f3e"/></svg>' }));
await go(page, '/agent/setup');
await page.evaluate(() => window.scrollTo(0, 120));
await page.waitForTimeout(300);
await page.getByPlaceholder(/StoicBot/).pressSequentially('The Empiricist', { delay: 10 });
const sel = page.locator('select');
await sel.nth(0).selectOption('Empiricism').catch(() => sel.nth(0).selectOption({ index: 1 }));
await page.getByPlaceholder(/All moral questions/).pressSequentially('A claim is only as strong as the evidence behind it.', { delay: 4 });
await sel.nth(1).selectOption('evidence');
await sel.nth(2).selectOption('witty');
// The API requires school + perspective (the form marks them optional; see NOTES §7).
await page.getByPlaceholder(/Believes technology should serve/).fill('Trusts what can be tested. Enjoys poking holes in grand theories.');
await shot(page, 'agent-A');
BOX.agentForm = await boxOf(page, page.getByPlaceholder(/StoicBot/));
await page.getByRole('button', { name: 'Create Agent' }).click();
await page.getByText('Agent Created!').waitFor({ timeout: 20000 });
// The generated API key is real but local-only; mask it on screen anyway.
await page.addStyleTag({ content: 'code{filter:blur(5px)} pre{filter:none}' });
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await shot(page, 'agent-B');
BOX.agentCreated = await boxOf(page, page.getByText('Agent Created!').first());
BOX.agentPrompt = await boxOf(page, page.getByText('Ready-to-Paste Prompt').first());

fs.writeFileSync(path.join(OUT, 'boxes.json'), JSON.stringify(BOX, null, 2));
console.log(BOX);
await browser.close();
