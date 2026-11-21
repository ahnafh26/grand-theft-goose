(function () {
// js/geese.js
// Waterloo's most famous residents: Canada geese on the lawns of UW, Laurier, Waterloo Park and Columbia Lake. They
// graze and wander near home; walk up to one on foot and it comes at you, neck out, hissing; a car closing in fast
// sends it flapping off over the rooftops (it lands back home a while later). Two instanced meshes (bodies, and the
// necks that pitch from grazing to alert), so the whole flock is two draw calls. ?geese=0 leaves them out.

const { THREE } = window.CITY;

const COUNT = 44;
const HOME_RADIUS = 22; // m a goose wanders from home
const ALERT = 6.5; // m: closer than this on foot and it charges
const CHARGE_SPEED = 3.3, WALK_SPEED = 0.55; // m/s
const SCATTER = 7; // m: a car this close & moving scares it off
const SIZE = 1.4; // the model's scale (a Canada goose stands ~0.9 m with its neck up)

// The flock's haunts (lat, lon, spread m, geese): UW's lawns round the Dana Porter Library, the Student Life Centre &
// the ponds by Laurel Creek, Laurier's quad, Waterloo Park's lake and Columbia Lake's shore
const HAUNTS = [
  [43.4695, -80.5430, 90, 10], // UW: the library lawns
  [43.4718, -80.5453, 60, 6], // UW: the SLC & the arts quad
  [43.4728, -80.5480, 70, 6], // UW: Laurel Creek & the residences
  [43.4737, -80.5283, 45, 6], // Laurier: the quad
  [43.4655, -80.5297, 80, 8], // Waterloo Park: Silver Lake
  [43.4786, -80.5512, 80, 8] // Columbia Lake
];

function gooseGeometries() {
  const body = [], neck = [];
  const add = (list, geo, hex, [x, y, z], [sx, sy, sz] = [1, 1, 1], rx = 0) => {
    geo.scale(sx, sy, sz);
    if (rx) geo.rotateX(rx);
    geo.translate(x, y, z);
    const c = new THREE.Color(hex), n = geo.attributes.position.count;
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    list.push(geo.index ? geo.toNonIndexed() : geo);
  };
  const S = (w, h) => new THREE.SphereGeometry(1, w, h);
  // the body: brown-grey back & wings, pale breast, black tail, white under the tail, dark legs (+z forward)
  add(body, S(12, 8), 0x6b5d4d, [0, 0.42, -0.02], [0.24, 0.2, 0.43]);
  add(body, S(10, 7), 0xcfc6b6, [0, 0.36, 0.2], [0.2, 0.18, 0.22]);
  add(body, S(8, 6), 0x151515, [0, 0.47, -0.42], [0.12, 0.07, 0.13]);
  add(body, S(8, 6), 0xf0eeea, [0, 0.37, -0.36], [0.13, 0.08, 0.1]);
  add(body, S(8, 6), 0x55483a, [0.17, 0.47, -0.05], [0.07, 0.11, 0.34]);
  add(body, S(8, 6), 0x55483a, [-0.17, 0.47, -0.05], [0.07, 0.11, 0.34]);
  for (const x of [0.07, -0.07]) add(body, new THREE.CylinderGeometry(0.014, 0.014, 0.24, 5), 0x262220, [x, 0.12, 0.03]);
  // the neck (pivot at its base, standing up +y), the head, the white chinstrap, the beak
  add(neck, new THREE.CylinderGeometry(0.04, 0.055, 0.42, 8), 0x141414, [0, 0.2, 0]);
  add(neck, S(10, 8), 0x141414, [0, 0.43, 0.04], [0.065, 0.065, 0.1]);
  add(neck, S(8, 6), 0xf4f2ee, [0, 0.41, 0.02], [0.07, 0.034, 0.06]);
  add(neck, new THREE.ConeGeometry(0.024, 0.08, 6), 0x101010, [0, 0.42, 0.15], [1, 1, 1], Math.PI / 2);
  const merge = window.CITY.Addons.mergeGeometries;
  return { body: merge(body), neck: merge(neck) };
}

let mounted = false;
let cm = null, traffic = null;
let bodies = null, necks = null;
const flock = [];
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qn = new THREE.Quaternion(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
const up = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3(1, 0, 0);
let honkCtx = null;

// a goose's honk: two short nasal blasts (WebAudio, made here, no sample)
function honk(volume = 0.15) {
  try {
    honkCtx = honkCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = honkCtx.currentTime;
    for (const at of [0, 0.22]) {
      const o = honkCtx.createOscillator(), g = honkCtx.createGain(), f = honkCtx.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(420, t0 + at);
      o.frequency.exponentialRampToValueAtTime(300, t0 + at + 0.16);
      f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 2.5;
      g.gain.setValueAtTime(0, t0 + at);
      g.gain.linearRampToValueAtTime(volume, t0 + at + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + at + 0.18);
      o.connect(f).connect(g).connect(honkCtx.destination);
      o.start(t0 + at);
      o.stop(t0 + at + 0.2);
    }
  } catch { /* no audio: silent geese */ }
}

function mount({ scene, controllerManager, trafficSystem }) {
  if (mounted || new URLSearchParams(location.search).get('geese') === '0') return;
  mounted = true;
  cm = controllerManager;
  traffic = trafficSystem;
  const { worldFromLatLon } = window.CITY;
  const { body, neck } = gooseGeometries();
  const mat = new THREE.MeshStandardNodeMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 });
  bodies = new THREE.InstancedMesh(body, mat, COUNT);
  necks = new THREE.InstancedMesh(neck, mat, COUNT);
  for (const m of [bodies, necks]) {
    m.castShadow = true;
    m.receiveShadow = true;
    m.frustumCulled = false; // (the flock is spread over the map; two cheap draws)
    scene.add(m);
  }
  bodies.name = 'Geese';
  necks.name = 'GeeseNecks';
  // homes: spots in each haunt off the roads (the ground there is a curb island's lawn)
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (const [lat, lon, spread, n] of HAUNTS) {
    const c = worldFromLatLon(lat, lon);
    for (let k = 0, tries = 0; k < n && tries < 200; tries++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * spread;
      const x = c.x + Math.cos(a) * r, z = c.z + Math.sin(a) * r;
      if (cm.isRoadway && cm.isRoadway(x, z)) continue;
      if (cm.nearColliders && cm.nearColliders(x, z, 1.5).some((col) => x > col.minX && x < col.maxX && z > col.minZ && z < col.maxZ && (col.maxY || 0) > 2)) continue;
      flock.push({ x, z, homeX: x, homeZ: z, y: 0, heading: rnd() * Math.PI * 2, state: 'graze', timer: rnd() * 5, neck: 1.0, step: rnd() * 10, fly: null });
      k++;
    }
  }
  bodies.count = necks.count = flock.length;
  console.info(`[geese] ${flock.length} geese on the lawns`);
}

// cars near (x, z): the traffic's & the one the player drives, as [x, z, speed m/s]
function carsNear(x, z, r) {
  const out = [];
  for (const c of traffic?.cars || []) {
    const cx = c.position ? c.position.x : c.x, cz = c.position ? c.position.z : c.z;
    if (cx === undefined || (c.placed === false)) continue;
    if (Math.abs(cx - x) > r || Math.abs(cz - z) > r) continue;
    out.push([cx, cz, Math.abs(c.speed ?? c.v ?? 0)]);
  }
  const me = cm.getActiveEntity();
  if (me && me.type !== 'person' && Math.abs(me.position.x - x) < r && Math.abs(me.position.z - z) < r) out.push([me.position.x, me.position.z, Math.abs(me.speed || 0)]);
  return out;
}

function update(dt) {
  if (!mounted || !flock.length) return;
  dt = Math.min(dt, 0.05);
  const me = cm.getActiveEntity();
  const onFoot = me && me.type === 'person';
  const px = me ? me.position.x : 1e9, pz = me ? me.position.z : 1e9;
  flock.forEach((g, i) => {
    g.timer -= dt;
    // flying off: up & away, then home again out of sight
    if (g.fly) {
      g.fly.t += dt;
      g.x += g.fly.vx * dt;
      g.z += g.fly.vz * dt;
      g.y += g.fly.vy * dt;
      if (g.fly.t > 9) { g.fly = null; g.x = g.homeX; g.z = g.homeZ; g.state = 'graze'; g.timer = 20 + Math.random() * 20; g.hidden = true; }
    } else {
      const pd = Math.hypot(px - g.x, pz - g.z);
      // a car closing in: off it goes, honking
      if (Math.hypot(px - g.x, pz - g.z) < 60 && carsNear(g.x, g.z, SCATTER).some(([, , s]) => s > 3)) {
        const a = g.heading + (Math.random() - 0.5);
        g.fly = { t: 0, vx: Math.sin(a) * 9, vz: Math.cos(a) * 9, vy: 3.5 };
        g.heading = a;
        if (pd < 40) honk(0.12);
      } else {
        if (g.hidden && g.timer < 0) g.hidden = false;
        if (onFoot && pd < ALERT && g.state !== 'charge' && !g.hidden) {
          g.state = 'charge';
          g.timer = 4;
          honk(0.18);
        }
        if (g.timer <= 0) {
          g.state = g.state === 'graze' ? 'walk' : 'graze';
          g.timer = 2 + Math.random() * 5;
          const home = Math.hypot(g.homeX - g.x, g.homeZ - g.z);
          g.heading = home > HOME_RADIUS ? Math.atan2(g.homeX - g.x, g.homeZ - g.z) : Math.random() * Math.PI * 2;
        }
        let speed = g.state === 'walk' ? WALK_SPEED : 0;
        if (g.state === 'charge') {
          g.heading = Math.atan2(px - g.x, pz - g.z);
          speed = pd > 1.1 ? CHARGE_SPEED : 0;
        }
        const nx = g.x + Math.sin(g.heading) * speed * dt, nz = g.z + Math.cos(g.heading) * speed * dt;
        if (!(cm.isRoadway && g.state === 'walk' && cm.isRoadway(nx, nz))) { g.x = nx; g.z = nz; }
        else g.timer = 0;
        g.step += speed * dt * 9;
        g.y = cm.getGroundHeight(g.x, g.z, 'person');
        g.speed = speed;
      }
    }
    // neck: down grazing, up walking, stretched forward charging
    const neckTarget = g.fly ? 0.2 : g.state === 'graze' ? 2.0 : g.state === 'charge' ? 1.1 : 0.15;
    g.neck += (neckTarget - g.neck) * Math.min(1, dt * 5);
    const hide = g.hidden ? 0 : SIZE;
    const bob = g.fly ? Math.sin(g.fly.t * 14) * 0.05 : Math.abs(Math.sin(g.step)) * 0.03 * (g.speed > 0 ? 1 : 0);
    const roll = g.fly ? 0 : Math.sin(g.step) * 0.1 * (g.speed > 0 ? 1 : 0);
    q.setFromAxisAngle(up, g.heading);
    qn.setFromAxisAngle(v3.set(0, 0, 1), roll);
    q.multiply(qn);
    m4.compose(v3.set(g.x, g.y + bob, g.z), q, one.set(hide, hide, hide));
    bodies.setMatrixAt(i, m4);
    // the neck from the breast, pitched forward by g.neck (radians)
    qn.setFromAxisAngle(side, g.neck);
    const nq = q.clone().multiply(qn);
    const base = v3.set(0, 0.5 * SIZE, 0.3 * SIZE).applyQuaternion(q).add({ x: g.x, y: g.y + bob, z: g.z });
    m4.compose(base, nq, one.set(hide, hide, hide));
    necks.setMatrixAt(i, m4);
  });
  bodies.instanceMatrix.needsUpdate = true;
  necks.instanceMatrix.needsUpdate = true;
}

window.CITY.geese = { mount, update, flock };
})();
