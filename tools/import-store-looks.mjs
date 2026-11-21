// tools/import-store-looks.mjs — the plaza stores' real signs from the reference research (stores.jsonl: each
// storefront's sign as photographed: its type, wording, board & letter colours) into tools/data/store-looks.json,
// keyed by the store's name, for tools/build-storefront-signs.mjs. Closed stores are kept, marked, so their signs are
// left out. The photos stay private and are never committed.
// usage: node tools/import-store-looks.mjs <stores.jsonl>
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./data/store-looks.json', import.meta.url));
export const storeKey = (name) => String(name || '').split(/\s[|(–-]\s|\(/)[0].normalize('NFKD').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const firstHex = (v) => { const m = /#([0-9a-f]{6})\b/i.exec(String(v || '')); return m ? parseInt(m[1], 16) : null; };
const out = {};
let n = 0;
for (const line of fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/)) {
  let r;
  try { r = JSON.parse(line); } catch { continue; }
  if (!r?.name) continue;
  const key = storeKey(r.name);
  const sg = r.sign || {};
  const closed = r.status === 'closed' || /closed/i.test(r.name);
  const look = { name: r.name, plaza: r.plaza, ...(r.lat ? { lat: +r.lat.toFixed(6), lon: +r.lon.toFixed(6) } : {}), ...(closed ? { closed: true } : {}) };
  const bg = firstHex(sg.bg_hex), ink = firstHex(sg.text_hex);
  if (bg !== null && ink !== null) {
    Object.assign(look, { bg, ink, type: /backlit|box|cabinet/i.test(sg.type || '') ? 'box' : 'letters' });
    const text = String(sg.text || '').replace(/\s*[/|#]\s*/g, ' ').replace(/\s+/g, ' ').trim();
    if (text && text.length <= 40 && !/[{}<>]/.test(text)) look.text = text;
  }
  out[key] = { ...(out[key] || {}), ...look };
  n++;
}
fs.writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.entries(out).sort()), null, 1) + '\n');
const vals = Object.values(out);
console.log(`[store looks] ${n} records: ${vals.filter((v) => v.bg !== undefined).length} signs with real colours, ${vals.filter((v) => v.closed).length} closed`);
