// Measure the built Puente docs the same way Linear and Notion were measured,
// and fail if Puente falls below them.
//
//   npm run build && npm run preview     # serves _site on :8091
//   npm run floor:check                  # writes tools/floor/report/index.html
//
// THE FLOOR (from tools/floor/floor.json, re-crawled with `npm run floor:crawl`)
//   Features  — any article feature that at least half of either reference
//               site's articles have is REQUIRED, on at least as large a share
//               of our articles as the higher of the two sites.
//   Measures  — our median screenshots/videos and sections (h2) per article must
//               be at least the HIGHER of the two reference medians. Words must
//               be at least 75% of the LOWER reference median: below that is
//               thin, but more words alone is not better documentation.
//   Site      — dark mode and a language switcher if either site has them; no
//               sideways scroll at phone width on any page we check.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArticle, extractSite } from './extract.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.DOCS_BASE || 'http://localhost:8091';
const REPORT = join(HERE, 'report');
mkdirSync(join(REPORT, 'shots'), { recursive: true });
const floor = JSON.parse(readFileSync(join(HERE, 'floor.json'), 'utf8'));
const median = (xs) => { const v = [...xs].sort((a, b) => a - b); return v.length ? v[Math.floor(v.length / 2)] : 0; };

// ── the floor ───────────────────────────────────────────────────────────────
const ref = floor.sites.map((s) => {
  const a = s.articles.filter((x) => !x.error);
  const share = {};
  for (const x of a) for (const [k, v] of Object.entries(x.features)) share[k] = (share[k] || 0) + (v ? 1 : 0) / a.length;
  return { name: s.name, site: s.site, share, media: median(a.map((x) => x.media)), h2: median(a.map((x) => x.h2)), words: median(a.map((x) => x.words)) };
});
const featureNames = Object.keys(ref[0].share);
const requiredFeatures = Object.fromEntries(featureNames
  .map((k) => [k, Math.max(...ref.map((r) => r.share[k] || 0))])
  .filter(([, s]) => s >= 0.5));
const measures = {
  media: Math.max(...ref.map((r) => r.media)),
  h2: Math.max(...ref.map((r) => r.h2)),
  words: Math.round(0.75 * Math.min(...ref.map((r) => r.words))),
};
const siteNeeds = { darkMode: ref.some((r) => r.site.darkMode), languageSwitcher: ref.some((r) => r.site.languageSwitcher) };

// ── our pages ───────────────────────────────────────────────────────────────
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/docs/`, { waitUntil: 'networkidle' });
const site = await page.evaluate(extractSite);
await page.screenshot({ path: join(REPORT, 'shots', 'puente-home-desktop.png') });
// The home page is a splash page with no sidebar; read the sidebar from an article.
await page.goto(`${BASE}/docs/get-started/welcome/`, { waitUntil: 'networkidle' });
const links = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
await page.goto(`${BASE}/docs/`, { waitUntil: 'networkidle' });
const articles = [...new Set(links.map((u) => u.split('#')[0]))]
  .filter((u) => u.startsWith(`${BASE}/docs/`) && !u.startsWith(`${BASE}/docs/es/`) && !u.endsWith('/docs/') && !/\/docs\/guides\/$/.test(u));
// Guides are articles too: collect them from the guides index.
await page.goto(`${BASE}/docs/guides/`, { waitUntil: 'networkidle' });
const guides = await page.$$eval('a[href*="/docs/guides/"]', (as) => as.map((a) => a.href.split('#')[0]));
const all = [...new Set([...articles, ...guides.filter((g) => !g.endsWith('/docs/guides/'))])];

const ours = [];
for (const url of all) {
  await page.goto(url, { waitUntil: 'networkidle' });
  ours.push({ url, ...(await page.evaluate(extractArticle)) });
}
if (ours[0]) {
  const sample = ours.find((a) => /find-records/.test(a.url)) || ours[0];
  await page.goto(sample.url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: join(REPORT, 'shots', 'puente-article-desktop.png') });
}
const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
const mp = await mobile.newPage();
const overflow = [];
for (const url of [`${BASE}/docs/`, `${BASE}/docs/es/`, ...all]) {
  await mp.goto(url, { waitUntil: 'networkidle' });
  const o = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (o > 0) overflow.push({ url, overflow: o });
}
const sampleMobile = ours.find((a) => /find-records/.test(a.url)) || ours[0];
if (sampleMobile) { await mp.goto(sampleMobile.url, { waitUntil: 'networkidle' }); await mp.screenshot({ path: join(REPORT, 'shots', 'puente-article-mobile.png') }); }
await browser.close();

// ── compare ─────────────────────────────────────────────────────────────────
const fails = [];
const ourShare = {};
for (const k of featureNames) ourShare[k] = ours.filter((a) => a.features[k]).length / (ours.length || 1);
for (const [k, need] of Object.entries(requiredFeatures)) {
  if (ourShare[k] + 1e-9 < need) {
    const missing = ours.filter((a) => !a.features[k]).map((a) => a.url.replace(BASE, ''));
    fails.push(`feature "${k}": ${(ourShare[k] * 100).toFixed(0)}% of our articles, floor ${(need * 100).toFixed(0)}%. Missing on: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ' …' : ''}`);
  }
}
const ourMeasures = { media: median(ours.map((a) => a.media)), h2: median(ours.map((a) => a.h2)), words: median(ours.map((a) => a.words)) };
for (const k of Object.keys(measures)) {
  if (ourMeasures[k] < measures[k]) fails.push(`median ${k} per article: ours ${ourMeasures[k]}, floor ${measures[k]}`);
}
const thinMedia = ours.filter((a) => a.media === 0).map((a) => a.url.replace(BASE, ''));
for (const [k, need] of Object.entries(siteNeeds)) if (need && !site[k]) fails.push(`site feature "${k}" is missing`);
for (const o of overflow) fails.push(`sideways scroll at 375px: ${o.url.replace(BASE, '')} (${o.overflow}px)`);
if (ours.length < 10) fails.push(`only ${ours.length} articles found — the crawl of our own site probably failed`);

// ── report ──────────────────────────────────────────────────────────────────
for (const s of ['linear', 'notion']) for (const v of ['home-desktop', 'article-desktop', 'article-mobile']) {
  const f = join(HERE, 'shots', `${s}-${v}.png`);
  if (existsSync(f)) copyFileSync(f, join(REPORT, 'shots', `${s}-${v}.png`));
}
const pct = (x) => `${Math.round(x * 100)}%`;
const row = (k) => `<tr><td>${k}</td>${ref.map((r) => `<td>${pct(r.share[k] || 0)}</td>`).join('')}<td><b>${pct(ourShare[k] || 0)}</b></td><td>${requiredFeatures[k] !== undefined ? pct(requiredFeatures[k]) : '—'}</td></tr>`;
const img = (n) => existsSync(join(REPORT, 'shots', `${n}.png`)) ? `<img src="shots/${n}.png" alt="${n}">` : '<p>(no capture)</p>';
writeFileSync(join(REPORT, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Docs floor report</title>
<style>body{font:15px/1.5 system-ui;margin:2rem;max-width:80rem}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:.3rem .6rem}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.grid img{width:100%;border:1px solid #ccc}.fail{color:#9e2b16}.ok{color:#136c3a}</style>
<h1>Puente docs vs. the floor (Linear, Notion)</h1>
<p>Reference crawl: ${floor.crawledAt}. Our site: ${ours.length} articles at ${BASE}/docs/.</p>
<h2 class="${fails.length ? 'fail' : 'ok'}">${fails.length ? `${fails.length} below the floor` : 'At or above the floor on every check'}</h2>
<ul>${fails.map((f) => `<li class="fail">${f}</li>`).join('')}</ul>
<h2>Article features (share of articles)</h2>
<table><tr><th>feature</th>${ref.map((r) => `<th>${r.name}</th>`).join('')}<th>Puente</th><th>floor</th></tr>${featureNames.map(row).join('')}</table>
<h2>Measures (median per article)</h2>
<table><tr><th></th>${ref.map((r) => `<th>${r.name}</th>`).join('')}<th>Puente</th><th>floor</th></tr>
${Object.keys(measures).map((k) => `<tr><td>${k}</td>${ref.map((r) => `<td>${r[k]}</td>`).join('')}<td><b>${ourMeasures[k]}</b></td><td>${measures[k]}</td></tr>`).join('')}</table>
<p>Articles with no screenshot at all: ${thinMedia.length ? thinMedia.join(', ') : 'none'}</p>
<h2>Site</h2><table><tr><th></th>${ref.map((r) => `<th>${r.name}</th>`).join('')}<th>Puente</th></tr>
${Object.keys(siteNeeds).map((k) => `<tr><td>${k}</td>${ref.map((r) => `<td>${r.site[k]}</td>`).join('')}<td><b>${site[k]}</b></td></tr>`).join('')}
<tr><td>sideways scroll at 375px</td>${ref.map((r) => `<td>${r.name === 'linear' ? 'none' : 'some'}</td>`).join('')}<td><b>${overflow.length ? overflow.length + ' pages' : 'none'}</b></td></tr></table>
<h2>Side by side</h2>
${['home-desktop', 'article-desktop', 'article-mobile'].map((v) => `<h3>${v}</h3><div class="grid"><figure>${img(`linear-${v}`)}<figcaption>Linear</figcaption></figure><figure>${img(`notion-${v}`)}<figcaption>Notion</figcaption></figure><figure>${img(`puente-${v}`)}<figcaption>Puente</figcaption></figure></div>`).join('')}
<h2>Every Puente article</h2><table><tr><th>page</th><th>words</th><th>h2</th><th>media</th>${featureNames.map((k) => `<th>${k}</th>`).join('')}</tr>
${ours.map((a) => `<tr><td>${a.url.replace(BASE, '')}</td><td>${a.words}</td><td>${a.h2}</td><td>${a.media}</td>${featureNames.map((k) => `<td>${a.features[k] ? '✓' : ''}</td>`).join('')}</tr>`).join('')}</table>`);
writeFileSync(join(REPORT, 'result.json'), JSON.stringify({ requiredFeatures, measures, ourShare, ourMeasures, fails, articles: ours.length }, null, 1));

console.log(`checked ${ours.length} articles against the floor`);
for (const f of fails) console.log(`  ✗ ${f}`);
console.log(fails.length ? `FAIL (${fails.length})` : 'PASS — at or above Linear and Notion on every check');
console.log('report: tools/floor/report/index.html');
process.exit(fails.length ? 1 : 0);
