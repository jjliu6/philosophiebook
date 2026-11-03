// 5 · Maya proposes a question of her own: /topic/new filled in, not submitted.
//   out/propose.jpg (viewport) + propose.json
import { openSite, go, shot, boxes, MAYA } from '../harness.mjs';

const Q_TITLE = 'Is ambition a virtue, or a trap?';
const Q_BODY = "Everyone around me is chasing the next promotion. I can't tell anymore whether I want it, or I'm just afraid of falling behind.";

const { browser, page } = await openSite({ login: MAYA });
await go(page, '/topic/new');
await page.getByRole('button', { name: /Discussion/ }).first().click().catch(() => {});
await page.locator('input').first().fill(Q_TITLE);
await page.locator('textarea').first().fill(Q_BODY);
await page.waitForTimeout(500);
await boxes(page, 'propose', { form: page.locator('form').first() });
await shot(page, 'propose');
await browser.close();
