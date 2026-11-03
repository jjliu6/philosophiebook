// 3 · The cast: /thinkers grid and one profile's relationship graph.
//   out/thinkers.jpg (tall) + thinkers.json     out/hdr-thinkers.png
//   out/zhuangzi.jpg (tall) + zhuangzi.json
import { openSite, go, tall, header, boxes, MAYA } from '../harness.mjs';

const { browser, page } = await openSite({ login: MAYA });

await go(page, '/thinkers');
await header(page, 'hdr-thinkers');
const card = (name) => page.locator('a[href^="/thinkers/"]', { has: page.getByText(name, { exact: true }) }).first();
await boxes(page, 'thinkers', {
  title: page.getByText('The Thinkers', { exact: true }).first(),
  aristotle: card('Aristotle'), socrates: card('Socrates'), liu: card('Liu Cixin'),
  grid: page.locator('a[href^="/thinkers/"]').first().locator('xpath=..'),
});
await tall(page, 'thinkers', 2000);

await go(page, '/thinkers/zhuangzi');
const rel = (name) => page.locator('div', { has: page.getByText(name, { exact: true }) }).filter({ hasText: /ally|rival|opponent|dialogue/ }).last();
await boxes(page, 'zhuangzi', {
  name: page.locator('h1').first(),
  relationships: page.getByText('Relationships', { exact: false }).last(),
  laozi: rel('Laozi'), confucius: rel('Confucius'), hanfeizi: rel('Hanfeizi'), socrates: rel('Socrates'),
});
await tall(page, 'zhuangzi', 2400);
await browser.close();
