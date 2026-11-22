// tools/build-massing-waterloo.mjs — writes massing.json (GEO_DATA) for Waterloo from OpenStreetMap building footprints,
// in the same shape tools/fetch-massing.mjs writes from the City of Toronto's 3D Massing: one lon/lat ring per building
// part with a maximum (roof top / ridge), an average (roughly the eaves) and a minimum height in metres.
// Waterloo has no lidar massing, so heights come from OSM: `height`, then `building:levels` (+ roof), then the type.
// usage: GEO_DATA=tools/data-waterloo node tools/build-massing-waterloo.mjs
import fs from 'node:fs';
import path from 'node:path';

const DATA = process.env.GEO_DATA;
if (!DATA) throw new Error('usage: GEO_DATA=<dir> node tools/build-massing-waterloo.mjs');
export const EDITION = 'osm-waterloo-2026';

const osm = JSON.parse(fs.readFileSync(path.join(DATA, 'osm_buildings.json'), 'utf8'));
const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};
const LEVEL = 3.2;
const HOUSE = /^(house|detached|semidetached_house|terrace|bungalow|cabin|farm)$/;
const SMALL = /^(garage|garages|shed|carport|hut|kiosk|roof|service|transformer_tower)$/;
const DEFAULTS = {
  apartments: 13, dormitory: 15, residential: 10, university: 14, college: 12, school: 9, hospital: 15, office: 14,
  commercial: 7, retail: 6, supermarket: 7, industrial: 9, warehouse: 8, church: 13, public: 10, civic: 10, hotel: 18,
};
const PITCHED = /^(gabled|hipped|pyramidal|gambrel|mansard|half-hipped|saltbox|round|dome|skillion)$/;

// Heights OpenStreetMap gets wrong for the landmarks people know (its outline is only the podium, or no levels mapped)
const NAME_HEIGHT = { 'Dana Porter Library': 40, 'Student Village 1 Central Complex': 9, 'University Club': 6 };

function heights(t) {
  if (NAME_HEIGHT[t.name]) return { max: NAME_HEIGHT[t.name], avg: NAME_HEIGHT[t.name] - 0.2, min: 0 };
  const type = t.building || 'yes';
  const roofH = num(t['roof:height']) || (t['roof:levels'] ? num(t['roof:levels']) * LEVEL * 0.8 : NaN);
  const pitched = PITCHED.test(t['roof:shape'] || '') || HOUSE.test(type);
  let max = num(t.height);
  let avg;
  if (!(max > 0)) {
    const levels = num(t['building:levels']);
    if (levels > 0) {
      const walls = levels * LEVEL + 0.6;
      const roof = roofH > 0 ? roofH : pitched ? 2.4 : 0.4;
      max = walls + roof;
      avg = walls + (pitched ? roof * 0.35 : roof * 0.5);
    } else if (HOUSE.test(type)) {
      max = 7.6;
      avg = 5.6;
    } else if (SMALL.test(type)) {
      max = 3.2;
      avg = 2.9;
    } else {
      max = DEFAULTS[type] ?? 8;
    }
  }
  if (avg === undefined) avg = pitched ? max - (roofH > 0 ? roofH * 0.65 : Math.min(2.2, max * 0.25)) : max - 0.2;
  const minH = num(t.min_height) > 0 ? num(t.min_height) : 0;
  return { max: Math.round(max * 10) / 10, avg: Math.round(Math.max(2.5, avg) * 10) / 10, min: Math.round(minH * 10) / 10 };
}

const ringOf = (geom) => geom.map((p) => [Math.round(p.lon * 1e7) / 1e7, Math.round(p.lat * 1e7) / 1e7]);
const closed = (r) => (r.length && (r[0][0] !== r.at(-1)[0] || r[0][1] !== r.at(-1)[1]) ? [...r, r[0]] : r);

// OpenStreetMap's building:part outlines (Simple 3D Buildings: a tower on its podium, the wings of different heights),
// fetched beside the buildings (osm_building_parts.json); a building they mostly cover stands as its parts instead
const area = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return Math.abs(a / 2); };
const inRing = ([x, y], r) => { let s = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) s = !s; } return s; };
const centroid = (r) => r.slice(0, -1).reduce((a, p, _, l) => [a[0] + p[0] / l.length, a[1] + p[1] / l.length], [0, 0]);
const PARTS_FILE = path.join(DATA, 'osm_building_parts.json');
const osmParts = (fs.existsSync(PARTS_FILE) ? JSON.parse(fs.readFileSync(PARTS_FILE, 'utf8')).elements : [])
  .filter((e) => e.type === 'way' && e.geometry?.length >= 4)
  .map((e) => { const ring = closed(ringOf(e.geometry)); return { e, ring, c: centroid(ring), a: area(ring) }; });
let usedParts = 0, splitBuildings = 0;
const partsOf = (ring) => {
  if (!osmParts.length) return null;
  const inside = osmParts.filter((p) => inRing(p.c, ring));
  if (!inside.length || inside.reduce((t, p) => t + p.a, 0) < area(ring) * 0.5) return null;
  return inside;
};

const parts = [];
let fid = 0;
for (const e of osm.elements) {
  const t = e.tags || {};
  if (!t.building || t.building === 'no') continue;
  // the enclosed bridges between buildings (MC-QNC, DC-EIT, PAC-SLC, E2-DWE...) start a floor up: the engine stands
  // every building on the ground, so they would wall off the walkways under them
  // open structures (a plaza's walkway canopy, carports): a solid block would wall off the shopfronts under them
  if (/^(roof|carport|canopy)$/.test(t.building) || t.layer === '1' && t.building === 'roof') continue;
  if (t.building === 'bridge' || (num(t['building:min_level']) >= 1 && !(num(t['building:levels']) > 4)) || num(t.min_height) >= 3) continue;
  const h = heights(t);
  const own = e.type === 'way' && e.geometry?.length >= 4 ? closed(ringOf(e.geometry)) : null;
  const split = own ? partsOf(own) : null;
  if (split) {
    const id = fid++;
    split.forEach((p, k) => {
      const pt = { ...p.e.tags, building: p.e.tags['building:part'] === 'yes' ? t.building : p.e.tags['building:part'] };
      parts.push({ fid: id, k, ring: p.ring, ...heights(pt), src: `osm:way/${e.id}` });
    });
    usedParts += split.length;
    splitBuildings++;
  } else if (own) {
    parts.push({ fid: fid++, ring: own, ...h, src: `osm:way/${e.id}` });
  } else if (e.type === 'relation') {
    let k = 0;
    const id = fid++;
    for (const m of e.members || []) {
      if (m.role !== 'outer' || !m.geometry || m.geometry.length < 4) continue;
      parts.push({ fid: id, k: k++, ring: closed(ringOf(m.geometry)), ...h, src: `osm:relation/${e.id}` });
    }
  }
}
fs.writeFileSync(path.join(DATA, 'massing.json'), JSON.stringify({ source: 'OpenStreetMap buildings (ODbL), heights from height / building:levels / type', edition: EDITION, parts }));
const tall = parts.filter((p) => p.max >= 30).length;
console.log(`[massing] ${parts.length} parts (${tall} at 30 m or more; ${splitBuildings} buildings stand as their ${usedParts} OSM building:parts) -> ${path.join(DATA, 'massing.json')}`);
