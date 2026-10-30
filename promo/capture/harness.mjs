// Playwright helpers: open the real PhilosophieBook site (next start, local
// Postgres seeded by promo/demo/) at 1440×900 @2x. Usage:
//   import { openSite, shot, tall, boxes } from '../harness.mjs';
//   const { browser, page } = await openSite({ login: MAYA });
// Nothing here changes the app: we only map fonts the Linux container lacks,
// serve the offline DiceBear avatar for the external agent, and stub Vercel's
// analytics endpoints (they only exist on Vercel).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp'; // the site's own devDependency

const here = path.dirname(fileURLToPath(import.meta.url));
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const { chromium } = await import(PW);

export const BASE_URL = process.env.PB_URL || 'http://127.0.0.1:3000';
export const OUT = path.join(here, 'out');
const FONTS = path.join(here, '..', 'assets', 'fonts');
const AVATARS = path.join(here, '..', 'assets', 'avatars');
export const W = 1440, H = 900;

export const MAYA = { email: 'maya@example.com', password: 'promo-demo-only-1' };

// The app's serif stack is "Georgia", "Times New Roman", serif (globals.css).
// Georgia is not on Linux; Gelasio (OFL) is metric-compatible with it.
const FONT_CSS = ['400', '500', '600', '700'].flatMap((w) => ['normal', 'italic'].map((s) =>
  `@font-face{font-family:"Georgia";src:url(/__promo/fonts/gelasio-latin-${w}-${s}.woff2) format("woff2");font-weight:${w};font-style:${s};}`)).join('\n');

export async function openSite({ login = null, browser } = {}) {
  const b = browser || (await chromium.launch());
  const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, locale: 'en-US', colorScheme: 'light' });
  await ctx.route('**/__promo/fonts/*', (route) => route.fulfill({
    status: 200, contentType: 'font/woff2', body: fs.readFileSync(path.join(FONTS, path.basename(new URL(route.request().url()).pathname))),
  }));
  await ctx.route('https://api.dicebear.com/**', (route) => {
    const seed = new URL(route.request().url()).searchParams.get('seed') || '';
    const file = path.join(AVATARS, `${seed.toLowerCase()}.svg`);
    route.fulfill(fs.existsSync(file) ? { status: 200, contentType: 'image/svg+xml', body: fs.readFileSync(file) } : { status: 404 });
  });
  await ctx.route('**/_vercel/**', (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await ctx.addInitScript({ content: `
    try { localStorage.setItem('theme', 'light'); } catch {}
    const css = ${JSON.stringify(FONT_CSS + '\n::-webkit-scrollbar{width:0;height:0}')};
    const inject = () => { const s = document.createElement('style'); s.id = 'promo-fonts'; s.textContent = css; document.head.appendChild(s); };
    if (document.head) inject(); else document.addEventListener('DOMContentLoaded', inject);
  ` });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message.slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|_vercel/.test(m.text())) console.log('[console]', m.text().slice(0, 200)); });
  if (login) {
    const res = await page.request.post(BASE_URL + '/api/auth/login', { data: login });
    if (!res.ok()) throw new Error('login failed ' + res.status());
  }
  return { browser: b, ctx, page };
}

export async function go(page, url) {
  await page.goto(BASE_URL + url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
}

// Problems that must never reach the film.
export async function assertClean(page, label) {
  const problems = await page.evaluate(() => {
    const out = [];
    const txt = document.body.innerText;
    if (txt.includes('[object Object]')) out.push('[object Object]');
    if (/\bundefined\b|\bNaN\b/.test(txt)) out.push('undefined/NaN text');
    document.querySelectorAll('img').forEach((im) => { if (im.complete && im.naturalWidth === 0 && im.getBoundingClientRect().width > 0) out.push('broken img ' + im.src.slice(0, 80)); });
    return out;
  });
  if (problems.length) console.log(`[${label}] WARN`, problems);
}

// Frames are stored as JPEG q94 4:4:4 (text stays crisp; the paper texture makes PNGs huge).
const saveJpeg = (buf, name) => sharp(buf).jpeg({ quality: 94, chromaSubsampling: '4:4:4' }).toFile(path.join(OUT, `${name}.jpg`));

export async function shot(page, name) {
  await assertClean(page, name);
  await page.mouse.move(W - 1, H - 1);
  await saveJpeg(await page.screenshot(), name);
  console.log('saved', `${name}.jpg`);
}

// Header strip as it looks at the top of this page (the stage pins it over tall shots).
export async function header(page, name) {
  const h = await page.evaluate(() => Math.ceil(document.querySelector('header').getBoundingClientRect().height));
  await page.screenshot({ path: path.join(OUT, `${name}.png`), clip: { x: 0, y: 0, width: W, height: h } });
  console.log('saved', `${name}.png`, `(${h}px)`);
  return h;
}

// Whole page with the sticky header hidden (layout kept), for scroll moves in the stage.
// `until` trims it to the part the film scrolls through (CSS px from the top).
export async function tall(page, name, until = Infinity) {
  await assertClean(page, name);
  await page.mouse.move(W - 1, H - 1);
  await page.addStyleTag({ content: 'header.sticky{visibility:hidden !important}', }).then((h) => h.evaluate((el) => el.setAttribute('data-promo', 'tall')));
  const h = Math.min(until, await page.evaluate(() => document.documentElement.scrollHeight));
  await saveJpeg(await page.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: W, height: h } }), name);
  await page.evaluate(() => document.querySelectorAll('style[data-promo="tall"]').forEach((s) => s.remove()));
  console.log('saved', `${name}.jpg`, `(${W}×${h})`);
  return h;
}

// Line boxes (page coordinates) of a sentence inside an element — the stage draws a
// highlighter over them when the VO quotes that line. Text may span several nodes.
export async function textRects(loc, snippet) {
  return loc.evaluate((root, snippet) => {
    const nodes = [];
    let all = '';
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n; (n = walk.nextNode());) { nodes.push([n, all.length]); all += n.nodeValue; }
    const i = all.indexOf(snippet);
    if (i < 0) return null;
    const at = (k) => { for (let j = nodes.length - 1; j >= 0; j--) if (nodes[j][1] <= k) return [nodes[j][0], k - nodes[j][1]]; };
    const r = document.createRange();
    r.setStart(...at(i));
    r.setEnd(...at(i + snippet.length));
    const lines = [];
    for (const b of r.getClientRects()) {
      if (b.width < 2) continue;
      const last = lines[lines.length - 1];
      // merge fragments on the same line
      if (last && Math.abs(last.y - (b.top + scrollY)) < 4) { last.width = Math.max(last.x + last.width, b.right + scrollX) - last.x; continue; }
      lines.push({ x: b.left + scrollX, y: b.top + scrollY, width: b.width, height: b.height });
    }
    return lines.map((l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, Math.round(v)])));
  }, snippet);
}

// Bounding boxes in page coordinates (CSS px), for camera / scroll targets.
// `marks` = { key: [locator, sentence] } → line rects for highlighter overlays.
export async function boxes(page, name, entries, extra = {}, marks = {}) {
  const res = { ...extra };
  for (const [key, loc] of Object.entries(entries)) {
    const b = await loc.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; }).catch(() => null);
    res[key] = b && Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v)]));
  }
  const lines = {};
  for (const [key, [loc, snippet]] of Object.entries(marks)) {
    lines[key] = await textRects(loc, snippet);
    if (!lines[key]) console.log(`[${name}] WARN mark not found: ${key}`);
  }
  fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({ viewport: { width: W, height: H }, boxes: res, marks: lines }, null, 2) + '\n');
  console.log(`${name}.json`, Object.keys(res).join(', '), Object.keys(lines).length ? `| marks: ${Object.keys(lines).join(', ')}` : '');
  return res;
}
