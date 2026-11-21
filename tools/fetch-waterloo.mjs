// tools/fetch-waterloo.mjs — writes the osm_*.json inputs of the geodata build (GEO_DATA) for Waterloo, Ontario, straight
// from the Overpass API, in the same shapes tools/fetch-osm.mjs produces for Toronto (Overpass `out body geom`).
// usage: GEO_DATA=tools/data-waterloo node tools/fetch-waterloo.mjs
// Covers the University of Waterloo, Wilfrid Laurier, University Ave and King St down to Uptown Waterloo.
import fs from 'node:fs';
import path from 'node:path';

const DATA = process.env.GEO_DATA;
if (!DATA) throw new Error('usage: GEO_DATA=<dir> node tools/fetch-waterloo.mjs');
fs.mkdirSync(DATA, { recursive: true });

// [south, west, north, east] for Overpass
// (covers tools/geo-roads.mjs DETAIL, the axis-aligned box of the game's rotated frame, with a margin: the curb islands
// need streets all round them, or the land outside the network becomes one island paved over the whole city)
export const CITY = [43.4505, -80.5635, 43.4945, -80.5045];
const WIDE = [43.44, -80.6, 43.5, -80.48];
const bb = (b) => b.join(',');
const UA = 'grand-theft-goose/0.1 (three.js city sim, Waterloo port)';
const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://lz4.overpass-api.de/api/interpreter'];

async function overpass(query, label) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    for (const ep of ENDPOINTS) {
      try {
        const res = await fetch(ep, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(query) });
        if (!res.ok) throw new Error(String(res.status));
        const json = await res.json();
        if (!Array.isArray(json.elements) || json.remark) throw new Error(json.remark || 'bad response');
        console.log(`[osm] ${label}: ${json.elements.length} elements from ${new URL(ep).host}`);
        return json.elements;
      } catch (e) {
        console.warn(`[osm] ${label} try ${attempt} ${new URL(ep).host}: ${e.message}`);
        await new Promise((r) => setTimeout(r, 3000 * attempt));
      }
    }
  }
  throw new Error(`Overpass failed for ${label}`);
}

const write = (name, elements) => {
  fs.writeFileSync(path.join(DATA, name), JSON.stringify({ version: 0.6, generator: 'tools/fetch-waterloo.mjs (Overpass)', elements }));
  console.log(`[osm] wrote ${name}: ${elements.length}`);
};
const center = (e) => {
  if (e.center) return e.center;
  const g = e.geometry || (e.members || []).filter((m) => m.role === 'outer').flatMap((m) => m.geometry || []);
  if (!g || !g.length) return null;
  return { lat: g.reduce((a, p) => a + p.lat, 0) / g.length, lon: g.reduce((a, p) => a + p.lon, 0) / g.length };
};
const isArea = (e) => (e.type === 'way' && e.geometry && e.geometry.length > 3 && e.geometry[0].lat === e.geometry.at(-1).lat && e.geometry[0].lon === e.geometry.at(-1).lon) || e.type === 'relation';
const H = `[out:json][timeout:240]`;

// ---------- roads & buildings ----------
const roads = await overpass(`${H};way["highway"](${bb(CITY)});out body geom;`, 'roads');
write('osm_roads.json', roads);
const buildings = await overpass(`${H};(way["building"](${bb(CITY)});relation["building"](${bb(CITY)}););out body geom;`, 'buildings');
write('osm_buildings.json', buildings);

// ---------- land: landuse / leisure / natural / man_made / some amenities, and linear water & walls ----------
const LAND_AMENITY = /^(parking|place_of_worship|university|college|school|hospital|fuel|marketplace)$/;
const land = await overpass(
  `${H};(
    way["landuse"](${bb(CITY)});relation["landuse"](${bb(CITY)});
    way["leisure"](${bb(CITY)});relation["leisure"](${bb(CITY)});
    way["natural"](${bb(CITY)});relation["natural"](${bb(CITY)});
    way["man_made"](${bb(CITY)});
    way["amenity"~"^(parking|place_of_worship|university|college|school|hospital|fuel|marketplace)$"](${bb(CITY)});
    relation["amenity"~"^(university|college|school|hospital)$"](${bb(CITY)});
    way["waterway"](${bb(CITY)});
    way["barrier"="wall"](${bb(CITY)});
  );out body geom;`,
  'land',
);
write(
  'osm_land.json',
  land.filter((e) => {
    const t = e.tags || {};
    if (isArea(e)) return t.landuse || t.leisure || t.natural || t.man_made || LAND_AMENITY.test(t.amenity || '');
    return t.waterway || t.man_made || t.natural || t.barrier === 'wall';
  }),
);

// ---------- railways: the ION light rail line and its stops ----------
const rails = await overpass(
  `${H};(way["railway"~"^(tram|rail|light_rail|subway)$"](${bb(CITY)});node["railway"="tram_stop"](${bb(CITY)});node["public_transport"="stop_position"]["light_rail"="yes"](${bb(CITY)}););out body geom;`,
  'rails',
);
write('osm_rails.json', rails);

// ---------- points of interest, places, signals, post boxes ----------
const pts = await overpass(`${H};node(${bb(WIDE)})[~"."~"."];out body;`.replace('[~"."~"."]', '["name"]'), 'named points');
const signalsAndBoxes = await overpass(
  `${H};(node["highway"="traffic_signals"](${bb(CITY)});node["crossing"="traffic_signals"](${bb(CITY)});node["amenity"="post_box"](${bb(CITY)});node["place"](${bb(WIDE)}););out body;`,
  'signals & places',
);
const namedAreas = await overpass(`${H};(way["name"](${bb(CITY)});relation["name"](${bb(CITY)}););out body geom;`, 'named areas');
const inCity = (e) => e.lat > CITY[0] && e.lat < CITY[2] && e.lon > CITY[1] && e.lon < CITY[3];

const PLACE_AMENITY = /^(townhall|courthouse|fountain|ferry_terminal)$/;
const placeLike = (t) => t.place === 'square' || t.tourism || t.historic || (t.name && (PLACE_AMENITY.test(t.amenity || '') || t.landuse || t.leisure || /^(tower|pier|breakwater)$/.test(t.man_made || '')));
const allPts = [...new Map([...pts, ...signalsAndBoxes].map((e) => [e.id, e])).values()];
write('osm_places.json', [...allPts.filter((e) => e.tags?.place), ...allPts.filter((e) => inCity(e) && placeLike(e.tags || {})), ...namedAreas.filter((e) => isArea(e) && placeLike(e.tags || {}))]);

const poiLike = (t) => t.name && (t.amenity || t.shop || t.office || t.tourism || t.leisure || t.healthcare || t.historic || t.government || t.diplomatic || t.building);
write('osm_pois.json', [
  ...allPts.filter((e) => inCity(e) && poiLike(e.tags || {})),
  ...namedAreas
    .filter((e) => isArea(e) && poiLike(e.tags || {}))
    .map((e) => ({ type: e.type, id: e.id, center: center(e), tags: e.tags }))
    .filter((e) => e.center),
]);
write('osm_postboxes.json', allPts.filter((e) => e.tags?.amenity === 'post_box' && inCity(e)));
write('osm_signals.json', allPts.filter((e) => inCity(e) && (e.tags?.highway === 'traffic_signals' || e.tags?.crossing === 'traffic_signals')));
// no subway, no Great Lake in Waterloo
write('osm_subway.json', []);
write('osm_lake.json', []);

// ---------- the City of Waterloo boundary (stands in for "the City of Toronto" relation) & districts ----------
const boundary = await overpass(`${H};relation["boundary"="administrative"]["admin_level"="8"]["name"="Waterloo"](${bb(WIDE)});out body geom;`, 'city boundary');
write('osm_fct.json', boundary.slice(0, 1));
write('osm_districts.json', []);
// ---------- street props: hydrants, bike racks, benches, shelters, bins, street lights, trees ----------
const props = await overpass(
  `${H};(node["emergency"="fire_hydrant"](${bb(CITY)});node["amenity"~"^(bicycle_parking|bench|waste_basket|recycling|shelter)$"](${bb(CITY)});` +
    `node["highway"~"^(bus_stop|street_lamp)$"](${bb(CITY)});node["natural"="tree"](${bb(CITY)}););out body;`,
  'street props',
);
write('osm_props.json', props);
console.log('[osm] done');
