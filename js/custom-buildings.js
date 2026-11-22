(function () {
// js/custom-buildings.js
// The landmarks' signature shapes, built from the architecture research (reference photos & architects' drawings,
// looked at, never copied into the game) onto each building's real OpenStreetMap footprint: Lazaridis Hall's copper
// drums under its cantilevered black zinc bars, Dana Porter Library's floating ribbed tower on its dark fascia with
// its penthouse & mast, the Davis Centre's green glass vault edge with its teal exhaust ducts & red portals, and the
// Quantum-Nano Centre's stainless steel honeycomb. Each stands in its footprint's own frame (along its longest wall),
// so it follows the map. ?custom=0 leaves them out.

const { THREE } = window.CITY;

function buildCustomBuildings(scene) {
  if (new URLSearchParams(location.search).get('custom') === '0') return null;
  const { GEO, MASSING, worldFromLatLon } = window.CITY;
  if (!MASSING || !(MASSING.rows instanceof Map)) return null;
  const group = new THREE.Group();
  group.name = 'CustomBuildings';
  // the compass in the world frame
  const o = worldFromLatLon(43.472, -80.53), e1 = worldFromLatLon(43.472, -80.529), n1 = worldFromLatLon(43.473, -80.53);
  const EAST = new THREE.Vector2(e1.x - o.x, e1.z - o.z).normalize(), NORTH = new THREE.Vector2(n1.x - o.x, n1.z - o.z).normalize();

  // A building's frame: u along its longest wall, v across; its extent in both, its height; and which ends face the
  // compass (west: u0 or u1, south: v0 or v1)
  function frameOf(name, pick = 'all') {
    const rows = [];
    GEO.buildings.forEach((b, i) => { if (b[9] === name && MASSING.rows.get(i)) rows.push({ b, ring: MASSING.rows.get(i).rings[0] }); });
    if (!rows.length) return null;
    const use = pick === 'tallest' ? [rows.reduce((a, r) => (r.b[4] > a.b[4] ? r : a))] : rows;
    let best = null;
    for (const { ring } of use) for (let i = 0; i < ring.length; i++) {
      const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % ring.length], L = Math.hypot(bx - ax, bz - az);
      if (!best || L > best.L) best = { L, dx: (bx - ax) / L, dz: (bz - az) / L };
    }
    const A = new THREE.Vector2(best.dx, best.dz), P = new THREE.Vector2(-best.dz, best.dx);
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity, h = 0;
    for (const { b, ring } of use) {
      h = Math.max(h, b[4]);
      for (const [x, z] of ring) { const u = x * A.x + z * A.y, v = x * P.x + z * P.y; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
    }
    const at = (u, v) => [A.x * u + P.x * v, A.y * u + P.y * v];
    return { A, P, u0, u1, v0, v1, h, at, yaw: Math.atan2(A.x, A.y) - Math.PI / 2,
      westAtU0: A.dot(EAST) > 0, southAtV0: P.dot(NORTH) > 0 };
  }
  // a mesh placed in a frame at (u, v), its base at y, its local x along u & z along v
  const put = (f, mesh, u, v, y = 0) => {
    const [x, z] = f.at(u, v);
    mesh.position.set(x, y, z);
    mesh.rotation.y = f.yaw;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const mat = (color, o = {}) => new THREE.MeshStandardNodeMaterial({ color, roughness: 0.6, metalness: 0.0, ...o });
  const COPPER = mat(0xb0622f, { roughness: 0.45, metalness: 0.55 });
  const ZINC = mat(0x2b2c2e, { roughness: 0.5, metalness: 0.5 });
  const SOFFIT = mat(0xb8743c, { roughness: 0.7 });
  const WARM_GLASS = mat(0xd9a85a, { roughness: 0.15, metalness: 0.1, emissive: new THREE.Color(0x6a4418) });
  const BLUE_GLASS = mat(0x7f98a8, { roughness: 0.08, metalness: 0.6 });
  const box = (w, hgt, d, m) => { const g = new THREE.BoxGeometry(w, hgt, d); g.translate(0, hgt / 2, 0); return new THREE.Mesh(g, m); };
  const drum = (rx, rz, hgt, m) => { const g = new THREE.CylinderGeometry(1, 1, hgt, 48); g.translate(0, hgt / 2, 0); g.scale(rx, 1, rz); return new THREE.Mesh(g, m); };
  let built = [];

  // ---- Lazaridis Hall (Diamond Schmitt, 2015)
  {
    const f = frameOf('Lazaridis Hall');
    if (f) {
      const W = f.westAtU0 ? f.u0 : f.u1, E = f.westAtU0 ? f.u1 : f.u0, ws = f.westAtU0 ? 1 : -1; // (ws: +1 when u grows eastward)
      const S = f.southAtV0 ? f.v0 : f.v1, ss = f.southAtV0 ? 1 : -1; // (ss: +1 when v grows northward)
      const vm = (f.v0 + f.v1) / 2;
      // the low copper auditorium drum at the west end, under the cantilevered top bar
      put(f, drum(14, 12, 9, COPPER), W + ws * 13, vm);
      put(f, box(30, 4.8, f.v1 - f.v0, ZINC), W + ws * 6, vm, 13.2); // the top bar running ~9 m past the west wall
      put(f, box(30, 0.25, f.v1 - f.v0, SOFFIT), W + ws * 6, vm, 13.0); // its warm copper/wood soffit
      // the raised two-band copper lecture drum at the south-east corner, over the glass cafe
      const du = E - ws * 14, dv = S - ss * 2;
      put(f, drum(9.5, 9.5, 5, WARM_GLASS), du, dv);
      put(f, drum(10.5, 10.5, 4, COPPER), du, dv, 5);
      put(f, drum(12, 12, 5.2, COPPER), du, dv, 9);
      put(f, drum(12.05, 12.05, 0.15, SOFFIT), du, dv, 5);
      // the 4-storey glass entrance slot on University Ave & the rooftop penthouse
      put(f, box(13, 17, 1.2, BLUE_GLASS), W + ws * (f.u1 - f.u0) * 0.42, S - ss * 0.3);
      put(f, box(40, 5, 18, ZINC), (f.u0 + f.u1) / 2 - ws * 6, vm + ss * 4, f.h);
      built.push('Lazaridis Hall');
    }
  }

  // ---- Dana Porter Library: the podium's dark fascia, the shadow gap under the ribbed tower, the penthouse & mast
  {
    const f = frameOf('Dana Porter Library');
    const t = frameOf('Dana Porter Library', 'tallest');
    if (f && t) {
      const um = (f.u0 + f.u1) / 2, vm = (f.v0 + f.v1) / 2;
      put(f, box(f.u1 - f.u0 + 0.3, 1.3, f.v1 - f.v0 + 0.3, mat(0x4a3a30)), um, vm, 8.7);
      const tu = (t.u0 + t.u1) / 2, tv = (t.v0 + t.v1) / 2;
      put(t, box(t.u1 - t.u0 - 2, 1.6, t.v1 - t.v0 - 2, mat(0x1e1b18)), tu, tv, 10.2);
      put(t, box(16, 4, 16, mat(0x4b3b33)), tu, tv, t.h);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8, 8), mat(0x6b6b6b, { metalness: 0.7 }));
      mast.geometry.translate(0, 4, 0);
      put(t, mast, tu, tv, t.h + 4);
      built.push('Dana Porter Library');
    }
  }

  // ---- Davis Centre: green glass curving over into the roof along both long sides, teal J ducts, red portals
  {
    const f = frameOf('William G. Davis Computer Research Centre');
    if (f) {
      const len = f.u1 - f.u0, um = (f.u0 + f.u1) / 2, h = Math.max(10, f.h);
      const GREEN = mat(0x5e8c88, { roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.92 });
      const TEAL = mat(0x4f8a86, { roughness: 0.35, metalness: 0.6 });
      const RED = mat(0xc8102e, { roughness: 0.4, metalness: 0.3 });
      for (const side of [-1, 1]) {
        const vEdge = side < 0 ? f.v0 : f.v1;
        // the quarter-barrel glass edge (a quarter cylinder along the wall, 4 m radius)
        const g = new THREE.CylinderGeometry(4, 4, len * 0.9, 24, 1, true, side < 0 ? Math.PI : 0, Math.PI / 2);
        g.rotateZ(Math.PI / 2);
        const vault = new THREE.Mesh(g, GREEN);
        put(f, vault, um, vEdge - side * 4, h - 4);
        // the ducts: up out of the roof, over the edge, down the glass
        for (let k = 0; k < 5; k++) {
          const u = f.u0 + len * (0.15 + 0.175 * k);
          const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3, 16), TEAL); riser.geometry.translate(0, 1.5, 0);
          put(f, riser, u, vEdge - side * 5, h);
          const arc = new THREE.Mesh(new THREE.TorusGeometry(3, 0.7, 12, 24, Math.PI / 2), TEAL);
          arc.geometry.rotateY(side < 0 ? Math.PI / 2 : -Math.PI / 2);
          put(f, arc, u, vEdge - side * 2, h + 0.5);
          const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 9, 16), TEAL); drop.geometry.translate(0, 4.5, 0);
          put(f, drop, u, vEdge + side * 1.2, h - 8.5);
        }
      }
      // the red steel portal at the main entrance (the middle of a long side)
      const v = f.v1 + 1.5;
      for (const du of [-3.5, 3.5]) put(f, box(0.5, 6, 0.5, RED), um + du, v);
      put(f, box(7.5, 0.6, 0.6, RED), um, v, 6);
      built.push('Davis Centre');
    }
  }

  // ---- QNC: the stainless steel honeycomb of stretched hexagons over its glass tower
  {
    const t = frameOf('Mike & Ophelia Lazaridis Quantum Nano Centre', 'tallest');
    if (t) {
      const STEEL = mat(0xd5d9dc, { roughness: 0.3, metalness: 0.85 });
      const R = 2.2, H = R * 1.9; // a hexagon's half-width & its (stretched) height
      const pos = [];
      const tube = (x0, y0, x1, y1) => pos.push([x0, y0, x1, y1]);
      const lw = t.u1 - t.u0, lv = t.v1 - t.v0, top = t.h - 1;
      // the lattice on a face, as segments in its own (s along the face, y) plane
      const lattice = (faceLen) => {
        const segs = [];
        for (let row = 0, y = 2; y < top; row++, y += H * 0.75) {
          for (let s = (row % 2) * R; s < faceLen; s += 2 * R) {
            const c = [[s - R, y + H * 0.25], [s, y], [s + R, y + H * 0.25], [s + R, y + H * 0.75], [s, y + H], [s - R, y + H * 0.75]];
            for (let k = 0; k < 6; k++) {
              const [a, b] = [c[k], c[(k + 1) % 6]];
              if (a[1] > top || b[1] > top || Math.min(a[0], b[0]) < 0 || Math.max(a[0], b[0]) > faceLen) continue;
              segs.push([a[0], a[1], b[0], b[1]]);
            }
          }
        }
        return segs;
      };
      const geo = [];
      const faces = [[t.u0, t.v0, 1, 0, lw, -1], [t.u0, t.v1, 1, 0, lw, 1], [t.u0, t.v0, 0, 1, lv, -1], [t.u1, t.v0, 0, 1, lv, 1]];
      const unit = new THREE.CylinderGeometry(0.09, 0.09, 1, 6);
      for (const [su, sv, du, dv, faceLen, out] of faces) {
        for (const [a, ay, b, by] of lattice(faceLen)) {
          const L = Math.hypot(b - a, by - ay);
          const g = unit.clone();
          g.scale(1, L, 1);
          g.rotateZ(-Math.atan2(b - a, by - ay));
          // into the frame: s runs along (du, dv), the face stands 0.8 m out
          const sm = (a + b) / 2, ym = (ay + by) / 2;
          const m = new THREE.Matrix4();
          const off = 0.8 * out;
          const u = su + du * sm + (dv ? off : 0), v = sv + dv * sm + (du ? off : 0);
          const [x, z] = t.at(u, v);
          const yaw = t.yaw + (dv ? Math.PI / 2 : 0);
          m.compose(new THREE.Vector3(x, ym, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw), new THREE.Vector3(1, 1, 1));
          g.applyMatrix4(m);
          geo.push(g);
        }
      }
      if (geo.length) {
        const merged = window.CITY.Addons.mergeGeometries(geo, false);
        const mesh = new THREE.Mesh(merged, STEEL);
        mesh.castShadow = true;
        group.add(mesh);
        built.push(`QNC (${geo.length} members)`);
      }
    }
  }

  scene.add(group);
  console.info(`[custom] ${built.join(', ')}`);
  return group;
}

Object.assign(window.CITY, { buildCustomBuildings });
})();
