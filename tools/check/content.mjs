// The docs' evidence check. Run after `npm run build`:  npm run check
//
// 1. Every interface label quoted on a page (<UI>…</UI>, rendered as
//    <strong class="ui">) exists word for word in that page's language, in the
//    Collect or Manage locale files (tools/check/locales/), or in
//    tools/check/ui-extra.json (labels hard-coded in app source, each with the
//    file and line it was read from).
// 2. Every {/* claim: id */} in a page has an entry in tools/check/claims.json.
//    When the app repositories are checked out beside this one, every evidence
//    quote is also re-found at its cited file and line.
// 3. Every internal link and #anchor in the built site resolves.
// 4. Every English page has a Spanish page at the same path, and back.
// 5. None of the course furniture the docs replaced: no quizzes, no
//    "by the end of this page" boxes.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const CONTENT = join(ROOT, 'src/content/docs');
const SRC = process.env.PUENTE_SRC || join(ROOT, '..');
const problems = [];
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const norm = (s) => s.normalize('NFC').replace(/[‘’]/g, "'").replace(/[“”«»]/g, '').replace(/…/g, '...')
  .replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim().toLowerCase();

// ── 1. interface labels ────────────────────────────────────────────────────
const strings = (o, out = []) => { if (typeof o === 'string') out.push(o); else if (o && typeof o === 'object') Object.values(o).forEach((v) => strings(v, out)); return out; };
const load = (f) => strings(JSON.parse(readFileSync(join(ROOT, 'tools/check/locales', f), 'utf8')));
const extra = existsSync(join(ROOT, 'tools/check/ui-extra.json')) ? JSON.parse(readFileSync(join(ROOT, 'tools/check/ui-extra.json'), 'utf8')) : { en: [], es: [] };
const POOL = {
  en: [...load('collect.en.json'), ...load('manage.en.json'), ...extra.en.map((e) => e.text)].map(norm),
  es: [...load('collect.es.json'), ...load('manage.es.json'), ...extra.es.map((e) => e.text)].map(norm),
};
const PH = /\{\{[^}]+\}\}|%\{\w+\}|%[sd]/g;
const matches = (label, lang) => POOL[lang].some((s) => s === label || s.includes(label)
  || (PH.test(s) && new RegExp('^' + s.split(PH).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.+?') + '$').test(label)));
const SOURCE_ONLY = process.argv.includes('--source');
const html = SOURCE_ONLY ? [] : (existsSync(DIST) ? walk(DIST).filter((f) => f.endsWith('.html')) : []);
if (!SOURCE_ONLY && !html.length) problems.push('dist/ is empty — run `npm run build` first');
let labels = 0;
// --source: check the <UI> labels in the MDX itself (no build needed).
if (SOURCE_ONLY) {
  for (const f of walk(CONTENT).filter((x) => /\.mdx?$/.test(x))) {
    const lang = relative(CONTENT, f).startsWith('es/') ? 'es' : 'en';
    for (const m of readFileSync(f, 'utf8').matchAll(/<UI>([\s\S]*?)<\/UI>/g)) {
      labels += 1;
      const label = norm(m[1].replace(/<[^>]+>/g, '').replace(/\{["'](.*?)["']\}/g, '$1'));
      if (!matches(label, lang)) problems.push(`${relative(CONTENT, f)}: "${m[1].trim()}" is not an interface label in the ${lang} app text`);
    }
  }
}
for (const f of html) {
  const s = readFileSync(f, 'utf8');
  const lang = (s.match(/<html[^>]*lang="(\w+)/) || [])[1] === 'es' ? 'es' : 'en';
  for (const m of s.matchAll(/<strong class="ui"[^>]*>([\s\S]*?)<\/strong>/g)) {
    labels += 1;
    const label = norm(m[1].replace(/<[^>]+>/g, ''));
    if (!matches(label, lang)) problems.push(`${relative(DIST, f)}: "${m[1].trim()}" is not an interface label in the ${lang} app text`);
  }
}

// ── 2. claims ──────────────────────────────────────────────────────────────
// One ledger file per docs section (tools/check/claims/*.json), merged here.
const ledger = { claims: {} };
for (const f of readdirSync(join(ROOT, 'tools/check/claims')).filter((x) => x.endsWith('.json'))) {
  const part = JSON.parse(readFileSync(join(ROOT, 'tools/check/claims', f), 'utf8')).claims || {};
  for (const id of Object.keys(part)) if (ledger.claims[id]) problems.push(`claim "${id}" is defined twice (${f})`);
  Object.assign(ledger.claims, part);
}
const mdx = walk(CONTENT).filter((f) => /\.mdx?$/.test(f));
const used = new Set();
for (const f of mdx) {
  for (const m of readFileSync(f, 'utf8').matchAll(/\{\/\*\s*claim:\s*([\w-]+)\s*\*\/\}/g)) {
    used.add(m[1]);
    if (!ledger.claims[m[1]]) problems.push(`${relative(CONTENT, f)}: claim "${m[1]}" has no entry in tools/check/claims/`);
  }
}
let quotesChecked = 0;
const haveSrc = existsSync(join(SRC, 'puente-reactnative-collect')) && existsSync(join(SRC, 'puente-react-nextjs-platform'));
for (const [id, c] of Object.entries(ledger.claims)) {
  if (!used.has(id)) problems.push(`claims.json: "${id}" is not used on any page`);
  if (!c.evidence?.length) problems.push(`claims.json: "${id}" has no evidence`);
  if (!haveSrc) continue;
  for (const ev of c.evidence || []) {
    if (ev.url) continue;
    // `git:<commit>:<path>` cites a file as it was at a commit of this repository
    // (the retired hand-written guides live on only in history).
    let lines;
    if (ev.file.startsWith('git:')) {
      try { lines = execSync(`git show ${ev.file.slice(4)}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n'); }
      catch { problems.push(`claims.json: "${id}" cites ${ev.file}, which git cannot show`); continue; }
    } else {
      const p = ev.file.startsWith('docs:') ? join(ROOT, ev.file.slice(5)) : join(SRC, ev.file);
      if (!existsSync(p)) { problems.push(`claims.json: "${id}" cites a missing file ${ev.file}`); continue; }
      lines = readFileSync(p, 'utf8').split('\n');
    }
    const win = norm(lines.slice(Math.max(0, ev.line - 5), ev.line + 4).join(' '));
    quotesChecked += 1;
    if (!win.includes(norm(ev.quote))) problems.push(`claims.json: "${id}" — quote not at ${ev.file}:${ev.line}: "${ev.quote}"`);
  }
}

// ── 3. links ───────────────────────────────────────────────────────────────
const ids = new Map();
const idsOf = (f) => { if (!ids.has(f)) ids.set(f, new Set([...readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))); return ids.get(f); };
let links = 0;
for (const f of html) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/<a [^>]*href="([^"]+)"/g)) {
    const href = m[1].replace(/&amp;/g, '&');
    if (!href.startsWith('/docs/') && !href.startsWith('#')) continue;
    links += 1;
    const [path, hash] = href.split('#');
    const target = path ? join(DIST, path.replace(/^\/docs\//, ''), path.endsWith('/') ? 'index.html' : '') : f;
    if (!existsSync(target)) { problems.push(`${relative(DIST, f)}: broken link ${href}`); continue; }
    if (hash && !idsOf(target).has(decodeURIComponent(hash))) problems.push(`${relative(DIST, f)}: missing anchor ${href}`);
  }
}

// ── 4. both languages ──────────────────────────────────────────────────────
const rel = mdx.map((f) => relative(CONTENT, f));
const en = rel.filter((r) => !r.startsWith('es/'));
const es = new Set(rel.filter((r) => r.startsWith('es/')).map((r) => r.slice(3)));
for (const r of en) if (!es.has(r)) problems.push(`no Spanish page for ${r}`);
for (const r of es) if (!en.includes(r)) problems.push(`no English page for es/${r}`);

// ── 5. no course furniture ─────────────────────────────────────────────────
for (const f of mdx) {
  const s = readFileSync(f, 'utf8');
  for (const bad of [/check yourself/i, /ponte a prueba/i, /by the end of this (page|guide)/i, /al terminar esta (página|guía)/i, /<details class="check"/]) {
    if (bad.test(s)) problems.push(`${relative(CONTENT, f)}: course furniture (${bad})`);
  }
}

console.log(`checked ${html.length} pages: ${labels} interface labels, ${used.size} claims${haveSrc ? ` (${quotesChecked} quotes re-found in app source)` : ' (app source not checked out — quotes not re-verified)'}, ${links} internal links, ${en.length} English / ${es.size} Spanish pages`);
for (const p of problems) console.log('  ✗ ' + p);
console.log(problems.length ? `FAIL (${problems.length})` : 'PASS');
process.exit(problems.length ? 1 : 0);
