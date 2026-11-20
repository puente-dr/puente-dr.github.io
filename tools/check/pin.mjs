// Fill in the `line` of every evidence quote in a claims ledger by finding the
// quote in the app source. A quote that cannot be found is reported, never
// guessed.
//
//   PUENTE_SRC=<folder with the app repos> node tools/check/pin.mjs tools/check/claims/<section>.json
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = process.env.PUENTE_SRC || join(ROOT, '..');
const norm = (s) => s.normalize('NFC').replace(/[‘’]/g, "'").replace(/[“”«»]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
let bad = 0;
for (const file of process.argv.slice(2)) {
  const ledger = JSON.parse(readFileSync(file, 'utf8'));
  for (const [id, c] of Object.entries(ledger.claims)) {
    for (const ev of c.evidence) {
      if (ev.url) continue;
      let lines;
      if (ev.file.startsWith('git:')) {
        try { lines = execSync(`git show ${ev.file.slice(4)}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n'); }
        catch { console.log(`✗ ${id}: git cannot show ${ev.file}`); bad += 1; continue; }
      } else {
        const p = ev.file.startsWith('docs:') ? join(ROOT, ev.file.slice(5)) : join(SRC, ev.file);
        if (!existsSync(p)) { console.log(`✗ ${id}: no such file ${ev.file}`); bad += 1; continue; }
        lines = readFileSync(p, 'utf8').split('\n');
      }
      const q = norm(ev.quote);
      const i = lines.findIndex((_, n) => norm(lines.slice(n, n + 3).join(' ')).includes(q));
      if (i < 0) { console.log(`✗ ${id}: quote not found in ${ev.file}: "${ev.quote}"`); bad += 1; continue; }
      ev.line = i + 1;
    }
  }
  writeFileSync(file, JSON.stringify(ledger, null, 1) + '\n');
}
console.log(bad ? `${bad} quote(s) not found` : 'all quotes pinned');
process.exit(bad ? 1 : 0);
