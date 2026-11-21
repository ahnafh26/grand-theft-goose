// tools/data/campus-looks.mjs — how the University of Waterloo's, Wilfrid Laurier's and the plazas' buildings look,
// modelled from reference photos (looked at, never copied into the game). Read by tools/build-waterloo-looks.mjs.
// Each entry, by the building's OpenStreetMap name: { wall, colour, brick?, tall?, low? }
//   wall: the facade style (STYLE below); colour: the wall's colour; brick: masonry joints in the shader
//   tall / low: a different { wall, colour, brick } for the building's parts at least `tall.from` m high / under it
//   (OSM building:parts: a tower on its podium)
export const STYLE = {
  render: 0, // punched windows in rendered or painted walls
  office: 1, // wider punched windows
  glass: 'glass', // blue-grey curtain wall
  darkGlass: 'darkGlass', // dark teal-grey curtain wall
  silverGlass: 'silverGlass', // pale silver curtain wall
  ribbon: 6, // horizontal window bands between spandrels
  slits: 7, // deep walls with tall narrow windows far apart
  residence: 8, // small punched windows, low storeys
  blank: 9, // big blank walls, a few high windows
  collegiate: 10, // tall, evenly spaced windows in brick
  ribs: 11 // close vertical fins over deep slots
};
export const LOOKS = {
  // ---- University of Waterloo (reference pass 1)
  'Dana Porter Library': { tall: { from: 25, wall: 'ribs', colour: 0xd9d9d4 }, low: { wall: 'darkGlass' } }, // big ribbed cube over a recessed base (photo)
  'Mathematics & Computer': { wall: 'ribbon', colour: 0xb8b2a6 }, // grey-beige concrete, rows of small windows (photo)
  'Mathematics 3': { wall: 'office', colour: 0xc4532f, brick: true }, // orange-red brick & blue-green glass (photo)
  'William G. Davis Computer Research Centre': { wall: 'ribbon', colour: 0xa8a49a }, // corrugated silver metal, glass barrel vault (photo)
  'Student Life Centre': { wall: 'office', colour: 0x8e6b4e, brick: true }, // curved glass front between buff-brick ends (photo)
  'Engineering 5': { wall: 'silverGlass' }, // grey-blue fritted glass in folded triangles (photo)
  'Pearl Sullivan Engineering Building': { wall: 'silverGlass' }, // E7
  'Engineering 6': { wall: 'office', colour: 0x4b5058 }, // dark charcoal panels, mixed punched windows (photo)
  'Mike & Ophelia Lazaridis Quantum Nano Centre': { wall: 'glass' },
  'Ira G. Needles Hall': { wall: 'ribbon', colour: 0xbdb7ac },
  'J. G. Hagey Hall of the Humanities': { wall: 'slits', colour: 0x8c5a3c, brick: true }, // red-brown brick, blank fly tower (photo)
  'Physical Activities Complex': { wall: 'blank', colour: 0x7c4a38, brick: true },
  'Columbia Icefield': { wall: 'blank', colour: 0xc8cbcd },
  'Feridun Hamdullahpur Field House': { wall: 'blank', colour: 0xa8a6a0 },
  'Physics': { wall: 'office', colour: 0xb79a72, brick: true }, // buff brick, 1960s window grid, rooftop dome (photo)
  'Chemistry 2': { wall: 'ribbon', colour: 0x9c7f62 },
  'Earth Sciences & Chemistry': { wall: 'ribbon', colour: 0x9c7f62 },
  'Environment 1': { wall: 'render', colour: 0x8c6a52, brick: true },
  'Environment 2': { wall: 'render', colour: 0x8c6a52, brick: true },
  'Environment 3': { wall: 'ribbon', colour: 0xc9c6c0 }, // grey & lime-green bands, green canopy (photo)
  'Tatham Centre for Co-operative Education and Career Action': { wall: 'ribbon', colour: 0x8b3a2e, brick: true }, // red-brown brick, glass corner (photo)
  'Arts Lecture Hall': { wall: 'blank', colour: 0xb5aa98 },
  'Student Village 1 Central Complex': { wall: 'residence', colour: 0x7e4e3a, brick: true },
  'Ron Eydt Village': { wall: 'residence', colour: 0x8b5a44, brick: true },
  'Mackenzie King Village': { wall: 'residence', colour: 0x8e6a4e, brick: true },
  'Claudette Millar Hall': { wall: 'residence', colour: 0xcfcbc4 },
  'Beck Hall': { wall: 'residence', colour: 0xc4b49c },
  'Eby Hall': { wall: 'residence', colour: 0xc4b49c },
  'Conrad Grebel University College': { wall: 'render', colour: 0x8a4a38, brick: true }, // red-brown brick, glass stair tower (photo)
  "St. Jerome's University": { wall: 'render', colour: 0xb08a6a, brick: true }, // low tan brick (photo)
  // ---- University of Waterloo (reference pass 2)
  'Biology 1': { wall: 'ribs', colour: 0xedede9 }, // white banded concrete, tall grouped windows between aggregate piers (photo)
  'Biology 2': { wall: 'ribbon', colour: 0x8a6a4e, brick: true },
  'Modern Languages': { wall: 'slits', colour: 0x6e4a38, brick: true },
  'Psychology, Anthropology & Sociology': { wall: 'ribbon', colour: 0xb8ae9e }, // terraced brutalist concrete, ribbon bands (photo)
  'Carl A. Pollock Hall': { wall: 'blank', colour: 0xb8946a, brick: true }, // buff brick tower (photo)
  'Engineering 2': { wall: 'ribbon', colour: 0x8e6e52, brick: true },
  'Engineering 3': { wall: 'office', colour: 0xc9c2b4 },
  'Douglas Wright Engineering Building': { wall: 'blank', colour: 0xb99a6c, brick: true }, // buff brick, glass entrance bay (photo)
  'Centre for Environmental and Information Technology': { wall: 'darkGlass' },
  'School of Optometry & Vision Science': { wall: 'ribbon', colour: 0x9c7f62, brick: true },
  'Science Teaching Complex': { wall: 'silverGlass' },
  'Applied Health Sciences Expansion Building': { wall: 'glass' },
  'South Campus Hall': { wall: 'office', colour: 0x8c5a44, brick: true },
  'Federation Hall': { wall: 'blank', colour: 0x8a5440, brick: true },
  'University Club': { wall: 'office', colour: 0x7e6450, brick: true },
  'Graduate House': { wall: 'render', colour: 0xf2f0ea }, // white stucco farmhouse, brown hipped roof (photo)
  'United College': { wall: 'residence', colour: 0x7a5040, brick: true }, // long brown-brick block (photo)
  'Renison University College': { wall: 'render', colour: 0xe2daca }, // cream stucco with stone piers (photo)
  'Burt Matthews Hall': { wall: 'ribbon', colour: 0xa0583c, brick: true }, // red-orange brick, ribbon windows (photo)
  'Minota Hagey Residence': { wall: 'residence', colour: 0x8e5444, brick: true },
  'East Campus Hall': { wall: 'blank', colour: 0xdadddf }, // silver standing-seam metal (photo)
  // ---- Wilfrid Laurier (reference pass)
  'Lazaridis Hall': { wall: 'darkGlass' }, // black zinc, wood & fritted glass
  'Frank C. Peters Building': { wall: 'ribbon', colour: 0xc9c2b4 }, // long concrete block, dark band windows
  'Laurier Library': { wall: 'slits', colour: 0x7a4a35, brick: true },
  'Arts Building - A Wing': { wall: 'collegiate', colour: 0x8a4b3a, brick: true },
  'Arts Building - C Wing': { wall: 'collegiate', colour: 0x8a4b3a, brick: true },
  'Arts Building - E Wing': { wall: 'collegiate', colour: 0x8a4b3a, brick: true },
  'Fred Nichols Campus Centre': { wall: 'blank', colour: 0x6f4a38, brick: true },
  'Bricker Academic Building': { wall: 'office', colour: 0x94503d, brick: true },
  'Science Building': { wall: 'ribbon', colour: 0x8f4c3b, brick: true },
  'Science Research Building': { wall: 'collegiate', colour: 0x8f4c3b, brick: true },
  'Athletics Complex': { wall: 'blank', colour: 0xb59e80 },
  'King Street Residence': { wall: 'residence', colour: 0x8a4a3a, brick: true },
  'Schlegel Building': { wall: 'office', colour: 0x8f4d3c, brick: true },
  'Alumni Hall': { wall: 'collegiate', colour: 0x8a4b3a, brick: true },
  'John Aird Centre': { wall: 'blank', colour: 0x8a4b3a, brick: true },
  'Dining Hall': { wall: 'office', colour: 0x7d5440, brick: true },
  'Bouckaert Residence': { wall: 'residence', colour: 0x8f4c3b, brick: true },
  'Willison Residence': { wall: 'residence', colour: 0x8a4b3a, brick: true },
  'Clara Conrad Residence': { wall: 'residence', colour: 0x8a4b3a, brick: true },
  'Dr. Alvin Woods Building': { wall: 'office', colour: 0x7d5440, brick: true },
  'Theatre Auditorium': { wall: 'blank', colour: 0x8a4b3a, brick: true }
};
// The plazas' unnamed buildings, by place: [lat, lon, radius m, look] (single-storey shop strips round their lots)
export const PLAZAS = [
  [43.4722, -80.5372, 95, { wall: 'render', colour: 0x7d4f3c, brick: true }], // University Plaza: brown brick & beige
  [43.4746, -80.5226, 55, { wall: 'render', colour: 0xd6c9b0 }] // 247 King St N: beige stucco
];
// Village 1's houses (North 1 ... West 6) take its brick
for (const side of ['North', 'South', 'East', 'West']) for (let n = 1; n <= 8; n++) LOOKS[`${side} ${n}`] = LOOKS['Student Village 1 Central Complex'];
