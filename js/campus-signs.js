(function () {
// js/campus-signs.js
// The names of the University of Waterloo's and Wilfrid Laurier University's buildings on their walls, as each
// campus signs them: UW's black panels with white lettering over a gold rule, Laurier's purple panels with gold
// lettering. One panel per named campus building (window.CITY.CAMPUS_SIGNS, tools/build-waterloo-looks.mjs), on the
// longest wall of its real outline that looks onto a street (else its longest wall), a storey up. Names are drawn
// with fillText (data, never markup) into one canvas atlas; one instanced draw for every panel. ?campussigns=0 leaves
// them out.

const { THREE } = window.CITY;
const { texture, uv, attribute, vec2, mix, smoothstep } = window.CITY.TSL;

const ATLAS_W = 2048, CELL_H = 64, PAD = 40; // the atlas's width, a panel's height in it & its side margins (px)
const PANEL_H = 1.1; // m
const MAX_W = 14.0; // m
const STYLE = [
  { board: '#111214', ink: '#ffffff', rule: '#e4b429' }, // UW
  { board: '#3b1f63', ink: '#f2c230', rule: '#f2c230' } // Laurier
];

function buildCampusSigns(scene) {
  const CITY = window.CITY;
  const list = CITY.CAMPUS_SIGNS || [];
  const M = CITY.MASSING;
  const off = new URLSearchParams(location.search).get('campussigns') === '0';
  if (!list.length || off) return { mesh: null, texture: null };
  const GEO = CITY.GEO;
  // the wall for each sign: the longest street edge of the real outline (massing), else the longest edge
  const placed = [];
  for (const [row, campus, name] of list) {
    const b = GEO.buildings[row];
    if (!b) continue;
    const foot = M && M.rows instanceof Map ? M.rows.get(row) : null;
    let best = null;
    if (foot) {
      const ring = foot.rings[0];
      for (let i = 0; i < ring.length; i++) {
        if (foot.hidden.has(i)) continue;
        const [ax, az] = ring[i], [bx, bz] = ring[(i + 1) % ring.length];
        const len = Math.hypot(bx - ax, bz - az);
        if (len < 5) continue;
        const score = len * (foot.street.has(i) ? 3 : 1);
        if (!best || score > best.score) best = { score, ax, az, bx, bz, len };
      }
    }
    if (!best) continue;
    const nx = (best.bz - best.az) / best.len, nz = -(best.bx - best.ax) / best.len;
    placed.push({ campus, name, x: (best.ax + best.bx) / 2, z: (best.az + best.bz) / 2, nx, nz, wall: best.len, h: b[4] });
  }
  if (!placed.length) return { mesh: null, texture: null };

  // the atlas: panels packed in shelves CELL_H high, each as wide as its name
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const font = (px) => `600 ${px}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  const PX = 34;
  ctx.font = font(PX);
  let sx = 0, sy = 0;
  for (const s of placed) {
    s.cellW = Math.min(ATLAS_W, Math.ceil(ctx.measureText(s.name).width + 2 * PAD));
    if (sx + s.cellW > ATLAS_W) { sx = 0; sy += CELL_H; }
    s.ox = sx; s.oy = sy;
    sx += s.cellW;
  }
  canvas.width = ATLAS_W;
  canvas.height = sy + CELL_H;
  const geometry = new THREE.PlaneGeometry(1, 1);
  const rect = new THREE.InstancedBufferAttribute(new Float32Array(placed.length * 4), 4);
  geometry.setAttribute('panelRect', rect);
  const mesh = new THREE.InstancedMesh(geometry, null, placed.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  placed.forEach((s, i) => {
    const st = STYLE[s.campus];
    const { ox, oy, cellW } = s;
    ctx.font = font(PX);
    ctx.fillStyle = st.board;
    ctx.fillRect(ox, oy, cellW, CELL_H);
    ctx.fillStyle = st.rule;
    ctx.fillRect(ox, oy + CELL_H - 8, cellW, 3);
    ctx.fillStyle = st.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.name, ox + cellW / 2, oy + CELL_H * 0.46, cellW - 2 * PAD + 10);
    // (v = 0 at the canvas's bottom: the texture is flipped on upload)
    rect.setXYZW(i, ox / canvas.width, 1 - (oy + CELL_H) / canvas.height, (ox + cellW) / canvas.width, 1 - oy / canvas.height);
    const w = Math.min(MAX_W, s.wall - 1, PANEL_H * (cellW / CELL_H));
    const y = Math.min(s.h - 1.0, 3.9);
    q.setFromAxisAngle(up, Math.atan2(s.nx, s.nz));
    m4.compose(new THREE.Vector3(s.x + s.nx * 0.09, y, s.z + s.nz * 0.09), q, new THREE.Vector3(w, PANEL_H * (w / (PANEL_H * (cellW / CELL_H))), 1));
    mesh.setMatrixAt(i, m4);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const r = attribute('panelRect', 'vec4');
  const st = uv();
  const texel = texture(tex, vec2(mix(r.x, r.z, st.x), mix(r.y, r.w, st.y)));
  const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.55, metalness: 0.05 });
  mat.colorNode = texel.rgb;
  // (a little backlit by day, so a panel in the wall's shadow still reads; lit up after dark)
  mat.emissiveNode = texel.rgb.mul(smoothstep(0.4, 1.1, CITY.cityUniforms.uInteriorGlow).mul(0.45).add(0.18));
  mesh.material = mat;
  mesh.name = 'CampusSigns';
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  scene.add(mesh);
  console.info(`[campus] ${placed.length} building names (UW ${placed.filter((s) => s.campus === 0).length}, Laurier ${placed.filter((s) => s.campus === 1).length})`);
  return { mesh, texture: tex };
}

Object.assign(window.CITY, { buildCampusSigns });
})();
