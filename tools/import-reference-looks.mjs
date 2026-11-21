// tools/import-reference-looks.mjs — turns the reference-photo research (looks.jsonl records: a building's walls,
// windows & colours as seen in its photos) into tools/data/reference-looks.json, keyed by OpenStreetMap element, for
// tools/build-waterloo-looks.mjs. Only records backed by photos at medium or high confidence are taken; the photos
// themselves stay private and are never committed.
// usage: node tools/import-reference-looks.mjs <looks.jsonl> [...more]
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./data/reference-looks.json', import.meta.url));
const looks = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const hex = (h) => (typeof h === 'string' && /^#?[0-9a-f]{6}$/i.test(h.trim()) ? parseInt(h.trim().replace('#', ''), 16) : null);
const lum = (c) => ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11;
let taken = 0, skipped = 0;
for (const file of process.argv.slice(2)) {
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    let r;
    try { r = JSON.parse(line); } catch { continue; }
    if (!r || !r.osm || !(r.photos || []).length || !/^(high|medium)/.test(r.confidence || '')) { skipped++; continue; }
    const wall0 = (r.walls || [])[0] || {};
    const material = String(wall0.material || '').toLowerCase();
    const colour = hex(wall0.colour_hex);
    const brick = /brick/.test(material);
    const win = String(r.windows || '').toLowerCase();
    const residence = /residence|village|house|hall$|place|court/i.test(r.name || '') && !/lecture|campus centre|dining/i.test(r.name || '');
    let wall;
    if (/glass/.test(material) || (/curtain/.test(win) && !brick && !/concrete|block|stone/.test(material))) wall = colour !== null && lum(colour) < 70 ? 'darkGlass' : colour !== null && lum(colour) > 150 ? 'silverGlass' : 'glass';
    else if (/ribbon|band/.test(win)) wall = 'ribbon';
    else if (/slit/.test(win)) wall = 'slits';
    else if (/rib|fin/.test(win)) wall = 'ribs';
    else if (/blank/.test(win)) wall = 'blank';
    else wall = residence ? 'residence' : brick ? 'collegiate' : 'office';
    const key = `osm:${r.osm.replace(/^osm:/, '')}`;
    looks[key] = { name: r.name, wall, ...(colour !== null ? { colour } : {}), ...(brick ? { brick: true } : {}), confidence: r.confidence };
    taken++;
  }
}
fs.writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.entries(looks).sort()), null, 1) + '\n');
console.log(`[reference looks] ${taken} buildings from photos (${skipped} records without photos or at low confidence), ${Object.keys(looks).length} in all`);
