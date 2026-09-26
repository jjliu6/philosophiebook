// Playwright helpers: open the REAL PhilosophieBook app (local `next dev` on a
// Postgres seeded with the repo's own seed scripts) at 1440×900 @2x.
//   import { openApp, shot } from './harness.mjs';
// Only two things are injected, both cosmetic: webfonts (the Linux container has
// no Georgia / Inter; see NOTES.md §3) and hiding the Next.js dev indicator.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);

export const BASE_URL = process.env.PB_URL || 'http://localhost:3000';
export const OUT = path.join(here, 'out');
const FONTS = path.join(here, '..', 'assets', 'fonts');

const CSS = `
@font-face{font-family:"Promo Inter";src:url(/__promo/fonts/inter-latin-wght-normal.woff2) format("woff2");font-weight:100 900;font-style:normal}
@font-face{font-family:"Promo Inter";src:url(/__promo/fonts/inter-latin-wght-italic.woff2) format("woff2");font-weight:100 900;font-style:italic}
${[400, 500, 600, 700].map((w) => ['normal', 'italic'].map((s) =>
  `@font-face{font-family:"Georgia";src:url(/__promo/fonts/gelasio-latin-${w}-${s}.woff2) format("woff2");font-weight:${w};font-style:${s}}`).join('')).join('')}
html{--font-inter:"Promo Inter"!important}
nextjs-portal{display:none!important}
`;

export async function openApp({ width = 1440, height = 900, scale = 2, browser, theme = 'light' } = {}) {
  const b = browser || (await chromium.launch());
  const ctx = await b.newContext({ viewport: { width, height }, deviceScaleFactor: scale, locale: 'en-US', colorScheme: theme });
  await ctx.route('**/__promo/fonts/*', (route) => {
    const file = path.join(FONTS, path.basename(new URL(route.request().url()).pathname));
    route.fulfill({ status: 200, contentType: 'font/woff2', body: fs.readFileSync(file) });
  });
  await ctx.addInitScript({ content: `
    const add=()=>{const s=document.createElement('style');s.id='promo-fonts';s.textContent=${JSON.stringify(CSS)};document.documentElement.appendChild(s);};
    if(document.documentElement)add();else document.addEventListener('DOMContentLoaded',add);` });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 300)));
  return { browser: b, ctx, page };
}

export async function go(page, url) {
  await page.goto(BASE_URL + url, { waitUntil: 'networkidle', timeout: 180000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
}

// Viewport screenshot (1440×900 CSS px → 2880×1800) into out/<name>.png
export async function shot(page, name, { scrollTo = null } = {}) {
  if (scrollTo !== null) {
    await page.evaluate((y) => window.scrollTo(0, y), scrollTo);
    await page.waitForTimeout(500);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(file);
  return file;
}

// Box of an element relative to the viewport (CSS px) — feeds stage/scenes.js camera targets.
export async function boxOf(page, selectorOrLocator) {
  const loc = typeof selectorOrLocator === 'string' ? page.locator(selectorOrLocator).first() : selectorOrLocator;
  const b = await loc.boundingBox();
  return b && { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height) };
}
