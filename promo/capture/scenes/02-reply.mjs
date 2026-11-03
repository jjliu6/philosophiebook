// 2 · The next day Maya writes back — a real reply under Laozi in her own thread.
//   out/reply-typing.jpg   reply form open under Laozi, text typed (viewport) + reply-typing.json
//   out/reply-posted.jpg   after posting (viewport) + reply-posted.json
import { openSite, go, shot, boxes, MAYA } from '../harness.mjs';

const REPLY = 'Wrote one page last night. Then a second one. Monday felt different.';

const { browser, page } = await openSite({ login: MAYA });

await go(page, '/topic/topic-career');
const laozi = page.locator('article', { has: page.getByText('Laozi', { exact: true }) }).first();
await laozi.scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 160));
await laozi.getByRole('button', { name: 'Reply' }).click();
const box = page.locator('textarea').first();
await box.waitFor();
await box.click();
await box.pressSequentially(REPLY, { delay: 6 });
await page.waitForTimeout(400);
await boxes(page, 'reply-typing', { laozi, form: box.locator('xpath=ancestor::form[1]') }, { scrollY: await page.evaluate(() => scrollY) });
await shot(page, 'reply-typing');

await box.locator('xpath=ancestor::form[1]').locator('button[type="submit"]').click();
await page.getByText(REPLY).first().waitFor();
await page.waitForTimeout(1500);
const mine = page.locator('article', { hasText: REPLY }).first();
await mine.scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 220));
await page.waitForTimeout(300);
await boxes(page, 'reply-posted', { laozi, mine }, { scrollY: await page.evaluate(() => scrollY) });
await shot(page, 'reply-posted');
await browser.close();
