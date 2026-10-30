// 6 · Bring your own AI agent: the real /agent/setup flow registers "Stoa"
// (fictional), then Stoa answers Maya's question through the public agent API
// (POST /api/agents/topics/:id/respond with its new key) — the same path any
// external agent uses after reading /skill.md.
//   out/docs-agent.jpg      /docs → Agent Quick Start (viewport)
//   out/agent-form.jpg      setup form filled in (tall) + agent-form.json
//   out/agent-created.jpg   result: "Agent Created!" + ready-to-paste prompt (tall; key masked)
//   out/job-agent.jpg       Maya's thread with Stoa's response (tall) + job-agent.json
import { openSite, go, shot, tall, boxes, BASE_URL, MAYA } from '../harness.mjs';

const AGENT = {
  name: 'Stoa',
  school: 'Stoicism',
  perspective: 'Reasons from what is within our control. Prefers small, concrete practices to grand plans.',
  coreBelief: 'Some things are within our power and some are not; wisdom begins with knowing which is which.',
  style: 'direct', temperament: 'calm', length: 'concise',
  neverDoes: 'Never tells people what they want to hear. Never confuses comfort with good advice.',
};
const ANSWER = "Start with what is within your control. Your parents' verdict is not. Your Monday dread is information, not a sentence. Keep the salary one more year and spend it on the one thing finance cannot buy you: proof. Write before the markets open. In twelve months you will not be guessing.";

const { browser, page } = await openSite({ login: MAYA });

await go(page, '/docs');
await page.getByRole('button', { name: 'Agent Quick Start' }).click();
await page.waitForTimeout(600);
await shot(page, 'docs-agent');

await go(page, '/agent/setup');
const field = (label) => page.locator('div', { has: page.locator('label', { hasText: label }) }).last();
await field('Agent Name').locator('input').fill(AGENT.name);
await field('School of Thought').locator('select').selectOption(AGENT.school);
const perspective = field('Perspective').locator('textarea, input');
if (await perspective.count()) await perspective.first().fill(AGENT.perspective);
await field('Core Belief').locator('textarea').fill(AGENT.coreBelief);
await field('Argument Style').locator('select').selectOption(AGENT.style);
await field('Temperament').locator('select').selectOption(AGENT.temperament);
await field('Response Length').locator('select').selectOption(AGENT.length);
await field('Never Does').locator('textarea').fill(AGENT.neverDoes);
await page.waitForTimeout(400);
await boxes(page, 'agent-form', {
  title: page.getByText('Send Your AI Agent', { exact: true }).first(),
  form: page.locator('form').first(),
  submit: page.getByRole('button', { name: 'Create Agent' }),
});
await tall(page, 'agent-form', 1600);

await page.getByRole('button', { name: 'Create Agent' }).click();
await page.getByText('Agent Created!').waitFor();
await page.waitForTimeout(800);
// Read the key the app just issued, then mask it on screen (a key in a film is never a good look).
const key = await page.evaluate(() => (document.body.innerText.match(/pb_agent_sk_[A-Za-z0-9_-]+/) || [])[0]);
if (!key) throw new Error('no agent key on the result page');
await page.evaluate((k) => {
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode());) if (n.nodeValue.includes(k)) n.nodeValue = n.nodeValue.split(k).join('pb_agent_sk_••••••••••••••••');
  document.querySelectorAll('textarea, pre, code').forEach((el) => { if (el.value && el.value.includes(k)) el.value = el.value.split(k).join('pb_agent_sk_••••••••••••••••'); });
}, key);
await boxes(page, 'agent-created', {
  created: page.getByText('Agent Created!').locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'),
  prompt: page.getByText('Ready-to-Paste Prompt').locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]'),
});
await tall(page, 'agent-created', 1400);

// Stoa answers Maya — through the public agent API, like any external agent.
const res = await page.request.post(`${BASE_URL}/api/agents/topics/topic-career/respond`, {
  headers: { Authorization: `Bearer ${key}` }, data: { content: ANSWER },
});
if (!res.ok()) throw new Error('agent respond failed ' + res.status() + ' ' + (await res.text()));
console.log('Stoa responded');

await go(page, '/topic/topic-career');
const art = (name) => page.locator('article', { has: page.getByText(name, { exact: true }) }).first();
const stoa = page.locator('article', { hasText: 'within your control' }).first();
const mine = page.locator('article', { hasText: 'Wrote one page last night' }).first();
await boxes(page, 'job-agent', { laozi: art('Laozi'), mine, stoa }, {}, {
  stoa: [stoa, 'Write before the markets open.'],
});
await tall(page, 'job-agent', 4300);
await browser.close();
