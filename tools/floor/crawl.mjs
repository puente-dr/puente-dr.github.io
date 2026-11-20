// Crawl the two reference documentation sites and record what they offer.
//
//   npm run floor:crawl
//
// Writes tools/floor/floor.json and side-by-side screenshots in
// tools/floor/shots/. Both sites allow /docs and /help in robots.txt; the crawl
// is one page at a time with a pause between pages, and samples rather than
// mirrors (25 Linear articles, 25 Notion articles).
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArticle, extractSite } from './extract.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, 'shots');
mkdirSync(SHOTS, { recursive: true });
const PAUSE_MS = 1500;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 docs-floor-check';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sample(list, n) {
  const sorted = [...new Set(list)].sort();
  if (sorted.length <= n) return sorted;
  const step = sorted.length / n;
  return Array.from({ length: n }, (_, i) => sorted[Math.floor(i * step)]);
}

async function linearArticles() {
  const xml = await (await fetch('https://linear.app/sitemap.xml', { headers: { 'user-agent': UA } })).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  // Nested sitemaps: follow one level.
  const nested = locs.filter((l) => l.endsWith('.xml'));
  for (const n of nested) {
    const sub = await (await fetch(n, { headers: { 'user-agent': UA } })).text();
    locs.push(...[...sub.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  return sample(locs.filter((l) => /^https:\/\/linear\.app\/docs\/[a-z0-9-]+\/?$/.test(l)), 25);
}

async function notionArticles(page) {
  const urls = [];
  for (const start of ['https://www.notion.com/help', 'https://www.notion.com/help/guides']) {
    await page.goto(start, { waitUntil: 'domcontentloaded' });
    await sleep(PAUSE_MS);
    urls.push(...await page.$$eval('a[href]', (as) => as.map((a) => a.href)));
  }
  const clean = urls.map((u) => u.split(/[?#]/)[0]);
  const articles = clean.filter((u) => /^https:\/\/www\.notion\.com\/help\/[a-z0-9-]+$/.test(u)
    && !/\/help\/(category|guides|reference)$/.test(u));
  const guides = clean.filter((u) => /^https:\/\/www\.notion\.com\/help\/guides\/[a-z0-9-]+$/.test(u)
    && !/\/guides\/category\//.test(u));
  return [...sample(articles, 15), ...sample(guides, 10)];
}

async function measure(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  // Lazy images load on scroll; walk the page once.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  return { url, ...(await page.evaluate(extractArticle)) };
}

async function overflowAt375(browser, url) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, userAgent: UA, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await ctx.close();
  return over;
}

export async function crawlSite(browser, { name, home, articles }) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
  const page = await ctx.newPage();
  const list = typeof articles === 'function' ? await articles(page) : articles;
  await page.goto(home, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  const site = await page.evaluate(extractSite);
  const homeArticle = await page.evaluate(extractArticle);
  await page.screenshot({ path: join(SHOTS, `${name}-home-desktop.png`) });
  const out = [];
  for (const url of list) {
    await sleep(PAUSE_MS);
    try {
      out.push(await measure(page, url));
      process.stdout.write('.');
    } catch (e) {
      out.push({ url, error: String(e).slice(0, 200) });
      process.stdout.write('x');
    }
  }
  const good = out.filter((a) => !a.error);
  if (good[0]) {
    await page.goto(good[0].url, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.screenshot({ path: join(SHOTS, `${name}-article-desktop.png`) });
  }
  const mobile = [];
  for (const a of good.slice(0, 3)) { await sleep(PAUSE_MS); mobile.push(await overflowAt375(browser, a.url)); }
  const mctx = await browser.newContext({ viewport: { width: 375, height: 812 }, userAgent: UA, isMobile: true });
  const mp = await mctx.newPage();
  if (good[0]) { await mp.goto(good[0].url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {}); await mp.screenshot({ path: join(SHOTS, `${name}-article-mobile.png`) }); }
  await mctx.close();
  await ctx.close();
  console.log(` ${name}: ${good.length}/${out.length} articles`);
  return { name, home, site, homeFeatures: homeArticle.features, articles: out, mobileOverflow: mobile };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const browser = await chromium.launch();
  const sites = [];
  sites.push(await crawlSite(browser, { name: 'linear', home: 'https://linear.app/docs', articles: linearArticles }));
  sites.push(await crawlSite(browser, { name: 'notion', home: 'https://www.notion.com/help', articles: notionArticles }));
  await browser.close();
  writeFileSync(join(HERE, 'floor.json'), JSON.stringify({ crawledAt: new Date().toISOString(), sites }, null, 1));
  console.log('wrote tools/floor/floor.json');
}
