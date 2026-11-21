(function () {
// js/campus-landmarks.js
// The two universities' signs where they stand (located from photos, OpenStreetMap & the universities' design
// drawings): UW's "UNIVERSITY OF / WATERLOO" letters by the Dana Porter plaza, its black-and-gold gateway blades at
// the Ring Road entrance off University Ave and its north entrance sign on Columbia St; Laurier's landmark signs at
// the four corners of its campus. Lettering is drawn with fillText into canvas textures (cut out by their alpha where
// the sign is letters alone). ?landmarks=0 leaves them out.

const { THREE } = window.CITY;

// [lat, lon, the way the lettering faces (compass degrees)]
const UW_LETTERS = [43.4695358, -80.5414145, 52];
const UW_GATEWAY = [43.468849, -80.539498, 111];
const UW_NORTH = [43.474503, -80.546192, 333];
const LAURIER_CORNERS = [[43.473317, -80.524675, 118], [43.473679, -80.53118, 285], [43.475793, -80.525241, 28], [43.471604, -80.529106, 192]];

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function buildCampusLandmarks(scene) {
  if (new URLSearchParams(location.search).get('landmarks') === '0') return null;
  const { worldFromLatLon } = window.CITY;
  const ground = (window.CITY.CITY_BOUNDS && window.CITY.CITY_BOUNDS.sidewalkHeight) || 0.15;
  const group = new THREE.Group();
  group.name = 'CampusLandmarks';
  // a world position & the yaw that turns an object's +z (its face) to a compass bearing
  const east = (() => { const a = worldFromLatLon(43.472, -80.53), b = worldFromLatLon(43.472, -80.529); const L = Math.hypot(b.x - a.x, b.z - a.z); return [(b.x - a.x) / L, (b.z - a.z) / L]; })();
  const north = (() => { const a = worldFromLatLon(43.472, -80.53), b = worldFromLatLon(43.473, -80.53); const L = Math.hypot(b.x - a.x, b.z - a.z); return [(b.x - a.x) / L, (b.z - a.z) / L]; })();
  const place = (obj, lat, lon, bearing) => {
    const p = worldFromLatLon(lat, lon), r = (bearing * Math.PI) / 180;
    const dx = east[0] * Math.sin(r) + north[0] * Math.cos(r), dz = east[1] * Math.sin(r) + north[1] * Math.cos(r);
    obj.position.set(p.x, ground, p.z);
    obj.rotation.y = Math.atan2(dx, dz);
    group.add(obj);
  };
  const box = (w, h, d, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; return m; };
  const concrete = new THREE.MeshStandardNodeMaterial({ color: 0xc9c7c2, roughness: 0.9 });
  const black = new THREE.MeshStandardNodeMaterial({ color: 0x1c1b1c, roughness: 0.45, metalness: 0.5 });
  const sans = (px, w = 800) => `${w} ${px}px "Helvetica Neue", Helvetica, Arial, sans-serif`;

  // ---- UW: the letters (black metal: two cut-out layers make their thickness) on a concrete plinth
  {
    const o = new THREE.Object3D();
    o.add(box(7.8, 0.85, 1.1, concrete));
    const tex = canvasTexture(2048, 640, (g, w, h) => {
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#fff';
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
      g.font = sans(150, 700);
      g.fillText('UNIVERSITY OF', w / 2, 175);
      g.fillRect(w * 0.14, 205, w * 0.72, 10); // the thin rail under the small line
      g.font = sans(400, 900);
      g.fillText('WATERLOO', w / 2, 600, w - 40);
    });
    const letters = new THREE.MeshStandardNodeMaterial({ color: 0x161616, roughness: 0.4, metalness: 0.6, map: tex, alphaTest: 0.5, side: THREE.DoubleSide });
    for (let k = 0; k < 5; k++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 2.35), letters);
      p.position.set(0, 0.85 + 2.35 / 2, -0.12 + k * 0.06);
      p.castShadow = true;
      o.add(p);
    }
    place(o, ...UW_LETTERS);
  }

  // ---- UW: the gateway's three blades, black with gold perforated bands; the tallest carries the wordmark
  {
    const o = new THREE.Object3D();
    const band = canvasTexture(256, 1024, (g, w, h) => {
      g.fillStyle = '#231f20'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fed34c';
      for (let y = 700; y < 780; y += 12) for (let x = 6; x < w; x += 12) { g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill(); }
    });
    const word = canvasTexture(512, 2048, (g, w, h) => {
      g.fillStyle = '#231f20'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fed34c';
      for (let y = 1500; y < 1600; y += 14) for (let x = 7; x < w; x += 14) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); }
      g.save(); g.translate(w / 2, h * 0.42); g.rotate(-Math.PI / 2);
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = sans(120, 700); g.fillText('UNIVERSITY OF', 0, -80);
      g.font = sans(190, 800); g.fillText('WATERLOO', 0, 90);
      g.restore();
    });
    const plain = new THREE.MeshStandardNodeMaterial({ map: band, roughness: 0.5, metalness: 0.4 });
    const marked = new THREE.MeshStandardNodeMaterial({ map: word, roughness: 0.5, metalness: 0.4 });
    for (const [w, h, x, mat] of [[1.421, 4.1, -2.1, plain], [1.778, 4.8, -0.35, plain], [2.222, 5.613, 1.75, marked]]) {
      const blade = box(w, h, 0.3, black, x, 0.2);
      blade.material = [black, black, black, black, mat, black]; // (+z face: the band / wordmark)
      o.add(blade);
    }
    o.add(box(6.8, 0.2, 0.9, concrete));
    place(o, ...UW_GATEWAY);
  }

  // ---- UW: the north entrance's secondary sign
  {
    const o = new THREE.Object3D();
    const face = canvasTexture(512, 820, (g, w, h) => {
      g.fillStyle = '#231f20'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fed34c'; g.fillRect(0, h * 0.78, w, 18);
      g.fillStyle = '#fff'; g.textAlign = 'center';
      g.font = sans(54, 700); g.fillText('UNIVERSITY OF', w / 2, h * 0.36);
      g.font = sans(86, 800); g.fillText('WATERLOO', w / 2, h * 0.5);
      g.fillStyle = '#fed34c'; g.font = sans(40, 600); g.fillText('North Campus', w / 2, h * 0.68);
    });
    const m = new THREE.MeshStandardNodeMaterial({ map: face, roughness: 0.5, metalness: 0.4 });
    const sign = box(1.421, 2.282, 0.25, black);
    sign.material = [black, black, black, black, m, black];
    o.add(sign);
    place(o, ...UW_NORTH);
  }

  // ---- Laurier: the landmark sign at each corner of campus, in its flower bed with limestone boulders
  {
    const face = canvasTexture(1024, 568, (g, w, h) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      // the maple leaf (purple) beside LAURIER
      g.save(); g.translate(w * 0.17, h * 0.3); g.scale(1.6, 1.6); g.fillStyle = '#4f2683';
      g.beginPath();
      const leaf = [[0, -48], [8, -30], [22, -36], [18, -14], [40, -18], [30, 0], [42, 8], [16, 12], [6, 40], [0, 30], [-6, 40], [-16, 12], [-42, 8], [-30, 0], [-40, -18], [-18, -14], [-22, -36], [-8, -30]];
      leaf.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath(); g.fill(); g.fillRect(-3, 30, 6, 24); g.restore();
      g.fillStyle = '#1d2a4d'; g.textBaseline = 'middle'; g.textAlign = 'left';
      g.font = sans(150, 800); g.fillText('LAURIER', w * 0.3, h * 0.3, w * 0.66);
      g.fillStyle = '#4f2683'; g.font = 'italic 600 70px Georgia, "Times New Roman", serif'; g.textAlign = 'center';
      g.fillText('Inspiring Lives.', w / 2, h * 0.62);
      g.fillStyle = '#111111'; g.fillRect(0, h * 0.78, w, h * 0.22);
      g.fillStyle = '#ffffff'; g.font = sans(54, 700); g.fillText('WILFRID LAURIER UNIVERSITY', w / 2, h * 0.89, w - 60);
    });
    const faceMat = new THREE.MeshStandardNodeMaterial({ map: face, roughness: 0.6 });
    const white = new THREE.MeshStandardNodeMaterial({ color: 0xf4f2ee, roughness: 0.6 });
    const soil = new THREE.MeshStandardNodeMaterial({ color: 0x3e2c20, roughness: 1 });
    const flowers = new THREE.MeshStandardNodeMaterial({ color: 0x8a4fb0, roughness: 0.9 });
    const stone = new THREE.MeshStandardNodeMaterial({ color: 0xcfc6b2, roughness: 0.95 });
    for (const [lat, lon, f] of LAURIER_CORNERS) {
      const o = new THREE.Object3D();
      const sign = box(3.6, 2.0, 0.45, white, 0, 0.25);
      sign.material = [white, white, white, white, faceMat, white];
      o.add(sign);
      o.add(box(4.8, 0.25, 2.0, soil));
      for (const [x, z, s] of [[-1.9, 0.6, 0.5], [2.0, 0.5, 0.6], [-1.2, 0.85, 0.35], [1.3, 0.85, 0.4]]) {
        const b = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), stone);
        b.position.set(x, 0.25 + s * 0.5, z); b.castShadow = true; o.add(b);
      }
      for (let k = 0; k < 9; k++) { const fl = box(0.35, 0.2, 0.3, flowers, -1.8 + k * 0.45, 0.25, 0.55 + (k % 2) * 0.2); o.add(fl); }
      place(o, lat, lon, f);
    }
  }
  scene.add(group);
  console.info(`[campus] landmark signs: UW letters, gateway & north entrance, Laurier's ${LAURIER_CORNERS.length} corner signs`);
  return group;
}

Object.assign(window.CITY, { buildCampusLandmarks });
})();
