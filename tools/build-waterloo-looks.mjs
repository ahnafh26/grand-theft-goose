// tools/build-waterloo-looks.mjs — writes js/waterloo-looks.js: window.CITY.BUILDING_LOOKS, the facade of every building
// row that has a known look, read by buildings.js in place of its random palette draw:
//   row -> [paint hex, brick 0|1, glass 0|1]
// From OpenStreetMap's building:colour & building:material where they are mapped, else by campus: Laurier's red brick,
// UW's pale precast concrete with brown-brick residences, and the glass buildings of both by name.
// usage: GEO_DATA=tools/data-waterloo node tools/build-waterloo-looks.mjs   (after tools/build-geodata.mjs)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { toWorld } from './geo-base.mjs';
import { elemRings } from './geo-land.mjs';
import { LOOKS, STYLE } from './data/campus-looks.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA = process.env.GEO_DATA || path.join(ROOT, 'tools/data-waterloo');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/toronto-geodata-ids.js'), 'utf8'), ctx);
const IDS = ctx.window.CITY.GEO_IDS.buildings;
const parts = JSON.parse(fs.readFileSync(path.join(DATA, 'massing.json'), 'utf8')).parts;
const osm = JSON.parse(fs.readFileSync(path.join(DATA, 'osm_buildings.json'), 'utf8')).elements;
const land = JSON.parse(fs.readFileSync(path.join(DATA, 'osm_land.json'), 'utf8')).elements;
const tagsOf = new Map(osm.map((e) => [`osm:${e.type}/${e.id}`, e.tags || {}]));
const partOf = new Map(parts.map((p) => [p.k === undefined ? `${p.fid}` : `${p.fid}.${p.k}`, p]));

// the campuses (amenity=university, ways & multipolygons), as world [x, z] rings
const campus = (name) => land.filter((e) => e.tags?.amenity === 'university' && e.tags.name === name).flatMap((e) => elemRings(e));
const UW = campus('University of Waterloo'), WLU = campus('Wilfrid Laurier University');
const inRing = ([x, y], r) => { let s = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) s = !s; } return s; };
const centre = (ring) => ring.reduce((a, p) => [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length], [0, 0]);

const NAMED = { red: 0x8a4632, darkred: 0x6d3426, maroon: 0x6d3426, brown: 0x6b4a36, tan: 0xb59a74, beige: 0xc8b896, white: 0xd8d4cc,
  lightgrey: 0xb5b3ad, lightgray: 0xb5b3ad, grey: 0x8f8e8a, gray: 0x8f8e8a, darkgrey: 0x5e5d5a, darkgray: 0x5e5d5a, black: 0x2f2f2f,
  yellow: 0xcbb57a, orange: 0xb0673a, cream: 0xd9ceb0, sandybrown: 0xb88a5a, silver: 0xb4b8ba };
const colourOf = (c) => {
  if (!c) return null;
  c = c.trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(c)) return parseInt(c.slice(1), 16);
  if (/^#[0-9a-f]{3}$/.test(c)) return parseInt(c.slice(1).split('').map((d) => d + d).join(''), 16);
  return NAMED[c.replace(/[\s_-]/g, '')] ?? null;
};
const GLASS = /^(Mike & Ophelia Lazaridis Quantum Nano Centre|Engineering [567]|Pearl Sullivan Engineering Building|Science Teaching Complex|Mathematics 3|Lazaridis Hall|Applied Health Sciences Expansion Building|Accelerator Building|Toby Jenkins Applied Health Research Building|Centre for Environmental and Information Technology)$/;
const pick = (list, seed) => list[seed % list.length];
const LAURIER_BRICK = [0x8a4632, 0x7a3b2a, 0x96503a, 0x823f2e];
const UW_CONCRETE = [0xb8b0a0, 0xa9a396, 0xc4bcaa, 0xb2aa98];
const UW_BRICK = [0x6e4b3a, 0x7d5a44, 0x684536];
const RESIDENCE = /^(dormitory|residential|apartments)$/;

// The buildings people know by their look: [paint hex, brick, glass 0, wall style (buildings.js facadeStyles)]
// the modelled looks by name (tools/data/campus-looks.mjs) -> [paint hex, brick, glass, wall style] for a part
const GLASS_MAT = { glass: 1, darkGlass: 3, silverGlass: 4 };
const lookFor = (spec, part) => {
  const v = spec.tall && part.max >= spec.tall.from ? { ...spec, ...spec.tall } : spec.low && !(spec.tall && part.max >= spec.tall.from) && spec.tall ? { ...spec, ...spec.low } : spec;
  const wall = STYLE[v.wall] ?? v.wall;
  if (typeof wall === 'string') return [0x2a3744, 0, GLASS_MAT[wall]];
  return [v.colour ?? 0xb8b0a0, v.brick ? 1 : 0, 0, wall];
};
const BIG = /Physical Activities|Icefield|Field House|Athletics|Gym|Arena|Theatre Auditorium|Warehouse|Commisary|Central Services/;
const looks = {};
const signOf = new Map(); // OSM building -> its sign: [row, campus 0 UW | 1 Laurier, name] (js/campus-signs.js)
const tally = { named: 0, osm: 0, laurier: 0, uw: 0, glass: 0 };
IDS.forEach((id, row) => {
  const m = /^wl-osm-buildings-2026:(\d+(?:\.\d+)?)$/.exec(id);
  const part = m && partOf.get(m[1]);
  if (!part) return;
  const t = tagsOf.get(part.src) || {};
  const at = centre(part.ring.map(([lon, lat]) => toWorld(lon, lat)));
  const where = WLU.some((r) => inRing(at, r)) ? 'laurier' : UW.some((r) => inRing(at, r)) ? 'uw' : null;
  if (where && t.name && !/Interlocking$/.test(t.name)) {
    // (a building standing as its parts: one sign, on its largest part)
    const a = Math.abs(part.ring.reduce((acc, p, i, r) => (i ? acc + r[i - 1][0] * p[1] - p[0] * r[i - 1][1] : acc), 0));
    const key = `${part.src}`;
    const prev = signOf.get(key);
    if (!prev || a > prev.a) signOf.set(key, { a, sign: [row, where === 'uw' ? 0 : 1, t.name] });
  }
  const mat = (t['building:material'] || '').toLowerCase();
  const hex = colourOf(t['building:colour']);
  if (GLASS.test(t.name || '') || mat === 'glass') { looks[row] = [0x2a3744, 0, 1]; tally.glass++; return; }
  const named = LOOKS[t.name];
  if (named && where) { looks[row] = lookFor(named, part); tally.named++; return; }
  const res = RESIDENCE.test(t.building || '') || /Village|Residence|Hall$|House$|^(North|South|East|West) \d$/.test(t.name || '') && !/Lecture|Needles|Hagey|Pollock|Federation|Hall of/.test(t.name || '');
  const big = BIG.test(t.name || '');
  // the wall: [6] ribbon (UW's academic concrete), [8] residence, [9] gym & hall, [10] Laurier's collegiate brick
  const style = where === 'laurier' ? (big ? 9 : res ? 8 : 10) : where === 'uw' ? (big ? 9 : res ? 8 : 6) : undefined;
  if (hex !== null || mat) {
    const brick = mat === 'brick' ? 1 : 0;
    const base = hex ?? (brick ? (where === 'uw' ? pick(UW_BRICK, row) : pick(LAURIER_BRICK, row)) : mat === 'concrete' ? pick(UW_CONCRETE, row) : null);
    if (base !== null) { looks[row] = style === undefined ? [base, brick, 0] : [base, brick, 0, brick && style === 6 ? 1 : style]; tally.osm++; return; }
  }
  if (where === 'laurier') { looks[row] = [pick(LAURIER_BRICK, row), 1, 0, style]; tally.laurier++; }
  else if (where === 'uw') {
    looks[row] = res ? [pick(UW_BRICK, row), 1, 0, style] : [pick(UW_CONCRETE, row), 0, 0, style];
    tally.uw++;
  }
});
const signs = [...signOf.values()].map((v) => v.sign).sort((a, b) => a[0] - b[0]);
fs.writeFileSync(path.join(ROOT, 'js/waterloo-looks.js'),
  `// js/waterloo-looks.js — GENERATED by tools/build-waterloo-looks.mjs from OpenStreetMap (ODbL), do not edit by hand.\n` +
  `// GEO.buildings row -> [paint hex, brick, glass] (buildings.js)\n(function () { window.CITY = window.CITY || {}; window.CITY.BUILDING_LOOKS = ${JSON.stringify(looks)}; window.CITY.CAMPUS_SIGNS = ${JSON.stringify(signs)}; })();\n`);
console.log(`[looks] ${signs.length} campus names; ${Object.keys(looks).length} buildings: ${JSON.stringify(tally)} (campus rings: UW ${UW.length}, Laurier ${WLU.length})`);
