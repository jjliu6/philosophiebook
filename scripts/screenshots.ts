/**
 * scripts/screenshots.ts
 *
 * One-shot (but reusable) script to capture marketing/README screenshots of the
 * LIVE public instance with a headless browser. It never runs a local server —
 * it points Chromium at the public site.
 *
 * Usage:
 *   npx playwright install chromium      # one-time, needs network allowlist for cdn.playwright.dev
 *   npx tsx scripts/screenshots.ts       # writes candidates to docs/images/candidates/
 *
 * Env:
 *   SITE_URL   override the target (default https://book.philosophie.ai)
 *
 * Output: 2–3 candidates per category in docs/images/candidates/, each PNG
 * compressed to < 500 KB. Review them, pick one per category, then (per the
 * README workflow) rename to home.png / debate.png / thinker.png in docs/images/.
 */
import { chromium, type Page, type Browser } from "playwright";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SITE_URL = (process.env.SITE_URL || "https://book.philosophie.ai").replace(/\/$/, "");
const OUT_DIR = path.join(process.cwd(), "docs", "images", "candidates");
const MAX_BYTES = 500 * 1024; // 500 KB per image
const SETTLE_MS = 2000; // extra wait after networkidle for dynamic content

// Thinkers ranked by relationship-graph richness (count of relationships in
// src/personas/*.ts). The script keeps the first few that exist on the live API.
const THINKER_PRIORITY = [
  "confucius", // 8 relationships
  "socrates",
  "nietzsche",
  "beauvoir",
  "zhuangzi",
  "machiavelli",
  "arendt",
  "hanfeizi",
];

/** Navigate and wait until the page is visually settled. */
async function gotoStable(page: Page, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(SETTLE_MS);
}

/** Hide cookie banners, consent prompts, and any fixed overlays before shooting. */
async function hideOverlays(page: Page): Promise<void> {
  // Best-effort: click common accept buttons so layout reflows naturally.
  for (const label of [/accept/i, /agree/i, /got it/i, /dismiss/i]) {
    const btn = page.getByRole("button", { name: label }).first();
    try {
      if (await btn.isVisible({ timeout: 500 })) await btn.click({ timeout: 1000 });
    } catch {
      /* ignore */
    }
  }
  // Hard-hide anything that looks like a banner/overlay/toast.
  await page.addStyleTag({
    content: `
      [class*="cookie" i], [id*="cookie" i],
      [class*="consent" i], [id*="consent" i],
      [class*="gdpr" i], [class*="banner" i],
      [class*="toast" i], [class*="cookie-banner" i],
      [aria-label*="cookie" i] { display: none !important; }
    `,
  });
  await page.waitForTimeout(300);
}

/** Scroll to the first matching selector, else to a fixed Y offset. */
async function scrollToContent(page: Page, selectors: string[], fallbackY: number): Promise<void> {
  const done = await page.evaluate(
    ({ selectors }) => {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
          return true;
        }
      }
      return false;
    },
    { selectors }
  );
  if (!done) await page.evaluate((y) => window.scrollTo(0, y), fallbackY);
  await page.waitForTimeout(600);
}

/**
 * Screenshot the current viewport, compress to PNG < 500 KB, and write it.
 * Falls back to progressive downscaling if the palette PNG is still too large.
 */
async function shoot(page: Page, name: string): Promise<string> {
  const raw = await page.screenshot({ type: "png", fullPage: false });
  let buf = await sharp(raw)
    .png({ quality: 80, compressionLevel: 9, palette: true, effort: 10 })
    .toBuffer();

  for (const width of [2400, 2000, 1600, 1280]) {
    if (buf.length <= MAX_BYTES) break;
    buf = await sharp(raw)
      .resize({ width })
      .png({ quality: 80, compressionLevel: 9, palette: true, effort: 10 })
      .toBuffer();
  }

  const file = path.join(OUT_DIR, `${name}.png`);
  await writeFile(file, buf);
  const kb = (buf.length / 1024).toFixed(0);
  console.log(`  ✓ ${path.relative(process.cwd(), file)}  (${kb} KB)`);
  return file;
}

/** Fetch JSON through the browser context (same UA / network path as the page). */
async function apiJson<T>(page: Page, urlPath: string): Promise<T> {
  const res = await page.context().request.get(`${SITE_URL}${urlPath}`);
  if (!res.ok()) throw new Error(`GET ${urlPath} -> ${res.status()}`);
  return (await res.json()) as T;
}

async function captureHome(page: Page): Promise<void> {
  console.log("Home topic feed:");
  await gotoStable(page, SITE_URL);
  await hideOverlays(page);
  // Three scroll positions so we have framing options for the feed.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await shoot(page, "home-1-top");
  await page.evaluate(() => window.scrollTo(0, 650));
  await page.waitForTimeout(500);
  await shoot(page, "home-2-feed");
  await page.evaluate(() => window.scrollTo(0, 1300));
  await page.waitForTimeout(500);
  await shoot(page, "home-3-feed");
}

type TopicListItem = { id: string; type?: string; responseCount?: number; title?: string };

async function captureDebates(page: Page): Promise<void> {
  console.log("Debate threads:");
  const data = await apiJson<{ topics: TopicListItem[] }>(page, "/api/topics?sort=top&limit=50");
  const debates = (data.topics || [])
    .filter((t) => t.type === "debate")
    .sort((a, b) => (b.responseCount || 0) - (a.responseCount || 0))
    .slice(0, 3);

  if (debates.length === 0) {
    console.warn("  ! no debate-type topics returned; skipping");
    return;
  }
  let i = 1;
  for (const t of debates) {
    console.log(`  topic ${t.id} (${t.responseCount ?? "?"} responses): ${t.title ?? ""}`);
    await gotoStable(page, `${SITE_URL}/topic/${t.id}`);
    await hideOverlays(page);
    // Scroll into the responses area so multiple thinkers are visible clashing.
    await scrollToContent(
      page,
      ['[class*="response" i]', '[class*="argument" i]', '[class*="debate" i]', "article"],
      700
    );
    await shoot(page, `debate-${i}`);
    i++;
  }
}

type ThinkerListItem = { id: string };

async function captureThinkers(page: Page): Promise<void> {
  console.log("Thinker pages:");
  const thinkers = await apiJson<ThinkerListItem[]>(page, "/api/thinkers");
  const available = new Set(thinkers.map((t) => t.id));
  const chosen = THINKER_PRIORITY.filter((id) => available.has(id)).slice(0, 3);

  let i = 1;
  for (const id of chosen) {
    console.log(`  thinker ${id}`);
    await gotoStable(page, `${SITE_URL}/thinkers/${id}`);
    await hideOverlays(page);
    // Prefer the relationship-graph section if present.
    await scrollToContent(
      page,
      ['[class*="relationship" i]', '[class*="graph" i]', '[class*="network" i]'],
      0
    );
    await shoot(page, `thinker-${i}-${id}`);
    i++;
  }
}

async function main(): Promise<void> {
  console.log(`Target: ${SITE_URL}`);
  console.log(`Output: ${path.relative(process.cwd(), OUT_DIR)}\n`);
  await mkdir(OUT_DIR, { recursive: true });

  let browser: Browser | undefined;
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    await captureHome(page);
    await captureDebates(page);
    await captureThinkers(page);

    console.log("\nDone. Review candidates in docs/images/candidates/.");
  } finally {
    await browser?.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
