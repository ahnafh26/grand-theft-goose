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
  'Dana Porter Library': { tall: { from: 25, wall: 'ribs', colour: 0xd8d2c4 }, low: { wall: 'darkGlass' } },
  'Mathematics & Computer': { wall: 'ribbon', colour: 0xb9b3a8 }, // brutalist slab, ribbon bands between thick spandrels
  'Mathematics 3': { wall: 'silverGlass' },
  'William G. Davis Computer Research Centre': { wall: 'ribbon', colour: 0xc9c6be }, // pale "toaster" panels & block
  'Student Life Centre': { wall: 'office', colour: 0x8a4b36, brick: true },
  'Engineering 5': { wall: 'silverGlass' }, // white-fritted glass
  'Pearl Sullivan Engineering Building': { wall: 'silverGlass' }, // E7
  'Engineering 6': { wall: 'ribbon', colour: 0xd5d7d6 },
  'Mike & Ophelia Lazaridis Quantum Nano Centre': { wall: 'glass' },
  'Ira G. Needles Hall': { wall: 'ribbon', colour: 0xbdb7ac },
  'J. G. Hagey Hall of the Humanities': { wall: 'slits', colour: 0xa9a398 },
  'Physical Activities Complex': { wall: 'blank', colour: 0x7c4a38, brick: true },
  'Columbia Icefield': { wall: 'blank', colour: 0xc8cbcd },
  'Feridun Hamdullahpur Field House': { wall: 'blank', colour: 0xa8a6a0 },
  'Physics': { wall: 'office', colour: 0xc8b79a },
  'Chemistry 2': { wall: 'ribbon', colour: 0x9c7f62 },
  'Earth Sciences & Chemistry': { wall: 'ribbon', colour: 0x9c7f62 },
  'Environment 1': { wall: 'render', colour: 0x8c6a52, brick: true },
  'Environment 2': { wall: 'render', colour: 0x8c6a52, brick: true },
  'Tatham Centre for Co-operative Education and Career Action': { wall: 'silverGlass' },
  'Arts Lecture Hall': { wall: 'blank', colour: 0xb5aa98 },
  'Student Village 1 Central Complex': { wall: 'residence', colour: 0x7e4e3a, brick: true },
  'Ron Eydt Village': { wall: 'residence', colour: 0x8b5a44, brick: true },
  'Mackenzie King Village': { wall: 'residence', colour: 0x8e6a4e, brick: true },
  'Claudette Millar Hall': { wall: 'residence', colour: 0xcfcbc4 },
  'Beck Hall': { wall: 'residence', colour: 0xc4b49c },
  'Eby Hall': { wall: 'residence', colour: 0xc4b49c },
  'Conrad Grebel University College': { wall: 'render', colour: 0x9a7a5c, brick: true },
  "St. Jerome's University": { wall: 'render', colour: 0x7f4936, brick: true },
  // ---- University of Waterloo (reference pass 2)
  'Biology 1': { wall: 'ribbon', colour: 0x8e6e52, brick: true },
  'Biology 2': { wall: 'ribbon', colour: 0x8a6a4e, brick: true },
  'Modern Languages': { wall: 'slits', colour: 0x6e4a38, brick: true },
  'Psychology, Anthropology & Sociology': { wall: 'ribs', colour: 0xbdb4a2 },
  'Carl A. Pollock Hall': { wall: 'ribbon', colour: 0x8a6a4e, brick: true },
  'Engineering 2': { wall: 'ribbon', colour: 0x8e6e52, brick: true },
  'Engineering 3': { wall: 'office', colour: 0xc9c2b4 },
  'Douglas Wright Engineering Building': { wall: 'render', colour: 0x9a5a40, brick: true },
  'Centre for Environmental and Information Technology': { wall: 'darkGlass' },
  'School of Optometry & Vision Science': { wall: 'ribbon', colour: 0x9c7f62, brick: true },
  'Science Teaching Complex': { wall: 'silverGlass' },
  'Applied Health Sciences Expansion Building': { wall: 'glass' },
  'South Campus Hall': { wall: 'office', colour: 0x8c5a44, brick: true },
  'Federation Hall': { wall: 'blank', colour: 0x8a5440, brick: true },
  'University Club': { wall: 'office', colour: 0x7e6450, brick: true },
  'Graduate House': { wall: 'render', colour: 0xd8c9a8, brick: true }, // the old farmhouse in buff brick
  'United College': { wall: 'render', colour: 0xa88c6c, brick: true },
  'Minota Hagey Residence': { wall: 'residence', colour: 0x8a5a44, brick: true },
  'East Campus Hall': { wall: 'render', colour: 0xbfb29a },
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
