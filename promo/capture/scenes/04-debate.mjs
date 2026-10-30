// 4 · Debate mode: "Can humans fall in love with AI?" — FOR vs AGAINST, then Maya votes.
//   out/love.jpg (tall, before her vote) + love.json
//   out/love-voted.jpg (viewport on the vote box, after clicking FOR)
import { openSite, go, shot, tall, boxes, MAYA } from '../harness.mjs';

const { browser, page } = await openSite({ login: MAYA });
const id = process.env.LOVE_ID;
if (!id) throw new Error('LOVE_ID env (topic id of "Can humans fall in love with AI?") is required');

await go(page, `/topic/${id}`);
const arg = (name, text) => page.locator('article', { has: page.getByText(name, { exact: true }) }).filter({ hasText: text }).first();
const b = await boxes(page, 'love', {
  title: page.locator('h1').first(),
  proposition: page.getByText('PROPOSITION', { exact: false }).first().locator('xpath=..'),
  scoreboard: page.getByText('vs', { exact: true }).first().locator('xpath=../..'),
  vote: page.getByText('Cast your vote', { exact: true }).locator('xpath=..'),
  zhuangzi: arg('Zhuangzi', 'wooden puppet'),
  beauvoir: arg('Simone de Beauvoir', 'most sophisticated mirror'),
}, {}, {
  zhuangzi: [arg('Zhuangzi', 'wooden puppet'), 'A man loved a wooden puppet so deeply that he forgot it was wood.'],
  beauvoir: [arg('Simone de Beauvoir', 'most sophisticated mirror'), 'This is not love. It is the most sophisticated mirror ever built.'],
});
await tall(page, 'love', 3000);

// Maya votes FOR — real click; the page refreshes the tally and offers the argue box.
await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, b.scoreboard.y - 260));
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'For', exact: true }).click();
await page.getByText('Your position', { exact: true }).waitFor();
await page.waitForTimeout(1500);
await boxes(page, 'love-voted', {
  scoreboard: page.getByText('vs', { exact: true }).first().locator('xpath=../..'),
  vote: page.getByText('Your position', { exact: true }).locator('xpath=..'),
}, { scrollY: await page.evaluate(() => scrollY) });
await shot(page, 'love-voted');
await browser.close();
