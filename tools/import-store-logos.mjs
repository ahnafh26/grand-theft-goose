// tools/import-store-logos.mjs — the plaza stores' official logos (the logo research: logos.jsonl + the files beside
// it) into assets/logos/stores/<slug>.png (at most 512 px wide, PNG), and their file, aspect & board colour into
// tools/data/store-looks.json, for tools/build-storefront-signs.mjs. Logos are their owners' trademarks, shown only to
// identify the real shops (CREDITS.md).
// usage: node tools/import-store-logos.mjs <logos.jsonl>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = path.join(ROOT, 'assets/logos/stores');
const LOOKS = path.join(ROOT, 'tools/data/store-looks.json');
const storeKey = (name) => String(name || '').split(/\s[|(–-]\s|\(/)[0].normalize('NFKD').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
// the logos the research found white on a transparent ground (they go on a dark board)
const WHITE = new Set(['chatime', 'sultans', 'williams fresh cafe', 'williams', 'yunshang rice noodle', 'tahinis', 'perfect image studio']);
const looks = fs.existsSync(LOOKS) ? JSON.parse(fs.readFileSync(LOOKS, 'utf8')) : {};
const dir = path.dirname(process.argv[2]);
fs.mkdirSync(OUT, { recursive: true });
let n = 0;
for (const line of fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/)) {
  let r;
  try { r = JSON.parse(line); } catch { continue; }
  // (official logos only: a crop of a storefront photo reads as a photo, not a sign)
  if (!r?.store || !r.file || /^low/.test(r.confidence || '') || /photo crop/i.test(r.source_url || '')) continue;
  const src = path.isAbsolute(r.file) ? r.file : path.join(dir, r.file);
  if (!fs.existsSync(src)) continue;
  const key = storeKey(r.store), slug = key.replace(/ /g, '-');
  const file = `${slug}.png`;
  const img = sharp(src).resize({ width: 512, height: 256, fit: 'inside', withoutEnlargement: true }).png({ compressionLevel: 9, palette: true });
  const { width, height } = await img.toFile(path.join(OUT, file));
  const bg = String(r.background || '');
  looks[key] = { ...(looks[key] || { name: r.store }), logo: `assets/logos/stores/${file}`, logoAspect: Math.round((width / height) * 1000) / 1000,
    // (a white logo on a transparent ground needs a dark board)
    logoBoard: /^#[0-9a-f]{6}$/i.test(bg) ? parseInt(bg.slice(1), 16) : WHITE.has(key) || [...WHITE].some((w) => key.startsWith(w)) ? 0x1d1d1f : 0xfbfaf6 };
  n++;
}
fs.writeFileSync(LOOKS, JSON.stringify(Object.fromEntries(Object.entries(looks).sort()), null, 1) + '\n');
console.log(`[store logos] ${n} logos into assets/logos/stores/`);
