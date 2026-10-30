// 1 · Maya's question and the thinkers' thread (before she joins in).
//   out/forum.jpg            The Forum, top of the feed (viewport)
//   out/hdr-forum.png        its header strip
//   out/job.jpg              the topic page, tall (header hidden) + job.json boxes
//   out/hdr-plain.png        header on non-nav pages
// Signed in as the fictional member "maya" (promo/demo/demo-data.mjs).
import { openSite, go, shot, tall, header, boxes, MAYA } from '../harness.mjs';

const { browser, page } = await openSite({ login: MAYA });

await go(page, '/');
await shot(page, 'forum');
await header(page, 'hdr-forum');
await boxes(page, 'forum', {
  hero: page.getByText('The Forum', { exact: true }).first(),
  firstCard: page.locator('a[href^="/topic/"]').first(),
});

await go(page, '/topic/topic-career');
await header(page, 'hdr-plain');
const art = (name) => page.locator('article', { has: page.getByText(name, { exact: true }) }).first();
await boxes(page, 'job', {
  title: page.locator('h1').first(),
  question: page.getByText("I'm 28, earning great money", { exact: false }).first(),
  confucius: art('Confucius'),
  nietzsche: art('Nietzsche'),
  beauvoir: art('Simone de Beauvoir'),
  hanfeizi: art('Han Feizi'),
  socrates: art('Socrates'),
  laozi: art('Laozi'),
  footerOrgs: page.getByText('For organizations', { exact: false }).last(),
  footer: page.locator('footer').last(),
}, {}, {
  confucius: [art('Confucius'), 'is it actually the work you hate, or is it the person you are becoming while doing the work?'],
  nietzsche: [art('Nietzsche'), "Your parents think you're crazy. GOOD."],
  beauvoir: [art('Simone de Beauvoir'), 'But who does the dishes while you write at 5 AM?'],
  hanfeizi: [art('Han Feizi'), 'Let me offer arithmetic.'],
  socrates: [art('Socrates'), 'But I have questions.'],
  laozi: [art('Laozi'), 'Write one page tonight.'],
  footerOss: [page.locator('footer').last(), 'Open source under MIT'],
  footerOrgs: [page.locator('footer').last(), 'strategy councils, expert panels, policy rooms, and more.'],
});
await tall(page, 'job');
await browser.close();
