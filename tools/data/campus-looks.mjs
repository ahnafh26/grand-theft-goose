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
  'Dana Porter Library': { tall: { from: 25, wall: 'ribs', colour: 0xdcd6c8 }, low: { wall: 'darkGlass' } },
  'J. G. Hagey Hall of the Humanities': { wall: 'slits', colour: 0xb3a993 },
  'Mathematics & Computer': { wall: 'ribbon', colour: 0xbebbb3 },
  'Ira G. Needles Hall': { wall: 'ribbon', colour: 0xc4bfb3 },
  'William G. Davis Computer Research Centre': { wall: 'ribbon', colour: 0xc9b089 },
  'Student Life Centre': { wall: 'office', colour: 0x9c7b5e, brick: true },
  'Physical Activities Complex': { wall: 'blank', colour: 0xa59b88 },
  'Columbia Icefield': { wall: 'blank', colour: 0xb0aa9c },
  'Feridun Hamdullahpur Field House': { wall: 'blank', colour: 0xa8a6a0 },
  'Athletics Complex': { wall: 'blank', colour: 0x8a4632, brick: true },
  'Laurier Library': { wall: 'slits', colour: 0x8a4632, brick: true },
  'Claudette Millar Hall': { wall: 'residence', colour: 0xc2bcae },
  'Beck Hall': { wall: 'residence', colour: 0xb9b2a2 },
  'Eby Hall': { wall: 'residence', colour: 0xb9b2a2 }
};
