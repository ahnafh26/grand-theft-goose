// tools/fetch-logos.mjs — the brand logos for the storefront signs: every sign whose OpenStreetMap place carries a
// brand:wikidata tag gets that brand's logo (Wikidata P154, the file on Wikimedia Commons, 256 px) in assets/logos/,
// and assets/logos/index.json maps the brand's Wikidata ID to its file. Logos are their owners' trademarks, shown
// here only to identify the real shops (credited in CREDITS.md).
// usage: GEO_DATA=tools/data-waterloo node tools/fetch-logos.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA = process.env.GEO_DATA || path.join(ROOT, 'tools/data-waterloo');
const OUT = path.join(ROOT, 'assets/logos');
const UA = { 'User-Agent': 'grand-theft-goose-asset-script/1.0' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pois = JSON.parse(fs.readFileSync(path.join(DATA, 'osm_pois.json'), 'utf8')).elements;
const qids = [...new Set(pois.map((e) => e.tags?.['brand:wikidata']).filter(Boolean))];
fs.mkdirSync(OUT, { recursive: true });
const indexFile = path.join(OUT, 'index.json');
const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : {};

// P154 (logo image) for each brand; failing that, its parent organisation's (P749) or owner's (P127)
async function claims(ids) {
  const out = {};
  for (let i = 0; i < ids.length; i += 50) {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.slice(i, i + 50).join('|')}&props=claims&format=json`;
    const res = await (await fetch(url, { headers: UA })).json();
    Object.assign(out, res.entities || {});
    await sleep(400);
  }
  return out;
}
const val = (ent, p) => ent?.claims?.[p]?.[0]?.mainsnak?.datavalue?.value;
const todo = qids.filter((q) => !index[q]);
const ents = await claims(todo);
const logoOf = {};
const parents = {};
for (const q of todo) {
  const f = val(ents[q], 'P154');
  if (f) logoOf[q] = f;
  else { const p = val(ents[q], 'P749')?.id || val(ents[q], 'P127')?.id; if (p) parents[q] = p; }
}
const pents = await claims([...new Set(Object.values(parents))]);
for (const [q, p] of Object.entries(parents)) { const f = val(pents[p], 'P154'); if (f) logoOf[q] = f; }
console.log(`${qids.length} brands, ${Object.keys(index).length} already fetched, ${Object.keys(logoOf).length} logos found on Commons`);
for (const [q, file] of Object.entries(logoOf)) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=256`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: UA });
    const type = res.headers.get('content-type') || '';
    if (res.ok && type.startsWith('image/')) {
      const ext = type.includes('jpeg') ? 'jpg' : 'png';
      fs.writeFileSync(path.join(OUT, `${q}.${ext}`), Buffer.from(await res.arrayBuffer()));
      index[q] = { file: `${q}.${ext}`, commons: file };
      break;
    }
    await sleep(1500 * (attempt + 1));
  }
  await sleep(300);
}
fs.writeFileSync(indexFile, JSON.stringify(index, null, 1) + '\n');
console.log(`${Object.keys(index).length} logos in assets/logos/`);
