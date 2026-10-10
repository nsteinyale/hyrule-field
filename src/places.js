// Hyrule Field (fan-made). Units are meters.
// World axes: +x = east, -z = north (the camera looks -z, north, at spawn).
// Plain data only; terrain.js and layout.js both read it.

export const WATER = 0 // water surface height (lake, river, moat)
export const WORLD_R = 200 // walkable radius; cliffs and mountains rise past it
export const SPAWN = { x: -8, z: 80 } // on the castle road, facing north toward the castle

// Hyrule Castle: town walls (center lines), keep at the back, moat all around, drawbridge on the south
export const CASTLE = { x0: -45, x1: 45, z0: -185, z1: -125, h: 3, wallH: 11, wallT: 2.4, gate: 4.5 }
export const KEEP = { x: 0, z: -166, w: 32, d: 14, h: 16 }

// Lon Lon Ranch in the middle of the field: round fence, gate on the south, horse track inside
export const RANCH = { c: [35, -5], r: 30, h: 3.2, gate: 0.13, track: { c: [33, 6], r: 13 } }

// Kakariko Village on a raised shelf below Death Mountain
export const VILLAGE = { c: [125, -105], r: 30, h: 7 }
export const MOUNTAIN = { c: [235, -265], r: 165, h: 175 }

export const FOREST = { c: [140, 88], r: 55 }
export const DEKU = { c: [156, 110], r: 4.5 }
export const LAKE = { c: [-25, 158], r: 40, island: { c: [-25, 166], r: 8 } }
export const CANYON_X = -135 // west of this the grass turns to Gerudo sand and red rock

// Zora's River spills out of the east cliffs and winds down into Lake Hylia
export const RIVER = [[215, 5], [160, 26], [112, 50], [72, 80], [36, 104], [6, 117], [-12, 126]]

// dirt roads; the first one is the castle road that starts at spawn
export const PATHS = [
  [[-8, 86], [-6, 40], [-12, 0], [-6, -60], [0, -95], [0, -108]],
  [[-6, 40], [15, 31], [35, 25.5]],
  [[-6, -60], [40, -72], [85, -90], [100, -100]],
  [[15, 31], [60, 48], [95, 68], [120, 84]],
  [[-8, 86], [-20, 100], [-25, 112]],
  [[-12, 0], [-70, -6], [-130, -12], [-196, -12]],
]
