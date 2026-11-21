// Part 7: street props where the City (and OpenStreetMap) say they stand, for John's prop models (js/street-props.js):
// fire hydrants (City of Toronto Water Hydrants), post-and-ring bike stands (City of Toronto Street Furniture – Bicycle
// Parking, rings that exist), transit shelters & litter/recycling bins (Street Furniture – Transit Shelter and – Litter
// Receptacle, those in place) and Canada Post boxes (OpenStreetMap amenity=post_box). Flat [x, z, ...] per kind, 0.1 m.
import fs from 'node:fs';
import path from 'node:path';
import { toWorld, load, log } from './geo-base.mjs';
import { inDetail } from './geo-roads.mjs';

const RAW = process.env.PROPS_DATA || path.join(process.env.HOME, '.cache/slop-toronto/raw');
const q = (v) => Math.round(v * 10) / 10;
// one CSV line into fields (the City's CSVs quote their geometry JSON)
export function fields(line) {
  const out = [];
  let cur = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') quoted = false; else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out;
}
// Waterloo has no city CSV exports in this pipeline: street props come from OpenStreetMap (osm_props.json), by kind
let osmProps = null;
function osmPoints(test) {
  if (!osmProps) {
    try { osmProps = load('osm_props.json').elements; } catch { osmProps = []; }
  }
  const pts = [];
  for (const e of osmProps) {
    if (e.lat === undefined || !test(e.tags || {})) continue;
    const [x, z] = toWorld(e.lon, e.lat);
    if (inDetail(x, z)) pts.push(q(x), q(z));
  }
  return pts;
}
const OSM_FALLBACK = {
  'water-hydrants.csv': (t) => t.emergency === 'fire_hydrant',
  'bicycle-parking.csv': (t) => t.amenity === 'bicycle_parking',
  'transit-shelters.csv': (t) => (t.highway === 'bus_stop' && t.shelter === 'yes') || (t.amenity === 'shelter' && t.shelter_type === 'public_transport'),
  'litter-receptacles.csv': (t) => t.amenity === 'waste_basket' || (t.amenity === 'recycling' && t.recycling_type === 'container'),
};
function cityPoints(file, keep = () => true) {
  if (!fs.existsSync(path.join(RAW, file))) return OSM_FALLBACK[file] ? osmPoints(OSM_FALLBACK[file]) : [];
  const lines = fs.readFileSync(path.join(RAW, file), 'utf8').split(/\r?\n/);
  const head = fields(lines[0]);
  const gi = head.indexOf('geometry');
  const pts = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const f = fields(lines[i]);
    const row = Object.fromEntries(head.map((h, k) => [h, f[k]]));
    if (!keep(row)) continue;
    const m = /\[\s*\[?\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/.exec(f[gi] || '');
    if (!m) continue;
    const [x, z] = toWorld(+m[1], +m[2]);
    if (inDetail(x, z)) pts.push(q(x), q(z));
  }
  return pts;
}
export const props = {
  hydrant: cityPoints('water-hydrants.csv'),
  bikeRing: cityPoints('bicycle-parking.csv', (r) => r.ASSETTYPE === 'Ring' && r.STATUS === 'Existing'),
  shelter: cityPoints('transit-shelters.csv', (r) => r.STATUS === 'Existing'),
  litterBin: cityPoints('litter-receptacles.csv', (r) => r.STATUS === 'Existing'),
  postBox: (() => {
    let el = [];
    try { el = load('osm_postboxes.json').elements; } catch { el = []; }
    const pts = [];
    for (const e of el) { const [x, z] = toWorld(e.lon, e.lat); if (inDetail(x, z)) pts.push(q(x), q(z)); }
    return pts;
  })()
};
log(`street props: ${props.hydrant.length / 2} hydrants, ${props.bikeRing.length / 2} bike rings, ${props.shelter.length / 2} transit shelters, ${props.litterBin.length / 2} litter bins, ${props.postBox.length / 2} post boxes`);
