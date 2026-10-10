// Everything placed on the map, plus collision, floor height and "where am I".
// World axes: +x = east, -z = north. Units are meters.
import { CANYON_X, CASTLE, DEKU, FOREST, KEEP, LAKE, PATHS, RANCH, RIVER, SPAWN, VILLAGE, WATER, WORLD_R } from './places.js'
import { heightAt, pathDist, polyDist, rectDist, rng, segDist } from './terrain.js'

export { SPAWN, WATER, WORLD_R }
export const EYE = 1.65
export const R_PLAYER = 0.35
export const MAX_STEP = 0.6 // tallest rise you can walk up in one frame

const TAU = Math.PI * 2
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a))

// ---------- colliders: straight pieces (fences, walls) and circles (trees, towers, posts)
export const SEGS = []
export const CIRCLES = []
const seg = (a, b, t = 0.3) => SEGS.push({ a, b, t })
const circ = (x, z, r) => CIRCLES.push({ x, z, r })

// three.js rotation.y = rot maps local (x, z) to world like this; local +z is a building's front
export const toWorld = (o, lx, lz) => {
  const c = Math.cos(o.rot || 0)
  const s = Math.sin(o.rot || 0)
  return [o.x + lx * c + lz * s, o.z - lx * s + lz * c]
}

// ---------- buildings: rectangular footprint, gable roof (ridge along local x)
export const BUILDINGS = []
function building(b) {
  const o = { h: 4.5, roofH: 2.6, rot: 0, wall: 'plaster', roof: 'roofRed', kind: 'house', ...b }
  const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => toWorld(o, (sx * o.w) / 2, (sz * o.d) / 2))
  o.y = Math.min(...pts.map((p) => heightAt(p[0], p[1])))
  for (let i = 0; i < 4; i++) seg(pts[i], pts[(i + 1) % 4], 0.3)
  BUILDINGS.push(o)
  return o
}

// round towers: stone castle towers, the keep's spires, the ranch silo
export const TOWERS = []
const tower = (t) => {
  TOWERS.push(t)
  if (t.collide !== false) circ(t.x, t.z, t.r)
}

// ---------- Hyrule Castle + Castle Town
export const STALLS = []
export const FOUNTAIN = { x: 0, z: -143, r: 4.2 }
{
  const { x0, x1, z0, z1, wallT, gate } = CASTLE
  seg([x0, z0], [x1, z0], wallT)
  seg([x0, z0], [x0, z1], wallT)
  seg([x1, z0], [x1, z1], wallT)
  seg([x0, z1], [-gate, z1], wallT)
  seg([gate, z1], [x1, z1], wallT)
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) tower({ x, z, r: 5.5, h: 19, y0: 0, mat: 'stone', roof: 'roofBlue', roofH: 9 })
  for (const s of [-1, 1]) tower({ x: s * (gate + 3.2), z: z1, r: 3.4, h: 17, y0: 0, mat: 'stone', roof: 'roofBlue', roofH: 6, banner: true })

  const { x, z, w, d } = KEEP
  const k = [[x - w / 2, z - d / 2], [x + w / 2, z - d / 2], [x + w / 2, z + d / 2], [x - w / 2, z + d / 2]]
  for (let i = 0; i < 4; i++) seg(k[i], k[(i + 1) % 4], 0.5)
  for (const [tx, tz] of k) tower({ x: tx, z: tz, r: 3.5, h: 25, y0: 2, mat: 'keep', roof: 'roofBlue', roofH: 9 })
  tower({ x, z: z - 2, r: 5, h: 36, y0: 2, mat: 'keep', roof: 'roofBlue', roofH: 13, collide: false })

  const roofs = ['roofRed', 'roofBrown', 'roofBlue', 'roofRed']
  for (const side of [-1, 1]) {
    ;[-136, -150, -164, -177].forEach((hz, i) =>
      building({ x: side * 33, z: hz, w: 9, d: 9, h: 5, rot: (-side * Math.PI) / 2, roof: roofs[(i + (side > 0 ? 1 : 0)) % 4], wall: i % 2 ? 'plasterWarm' : 'plaster' }),
    )
  }
  circ(FOUNTAIN.x, FOUNTAIN.z, FOUNTAIN.r)
  for (const [sx, sz, color] of [[-13, -136, 'red'], [13, -136, 'blue'], [-13, -150, 'green'], [13, -150, 'yellow']]) {
    const s = { x: sx, z: sz, rot: sx < 0 ? Math.PI / 2 : -Math.PI / 2, color }
    STALLS.push(s)
    const p = [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]].map(([a, b]) => toWorld(s, a, b))
    for (let i = 0; i < 4; i++) seg(p[i], p[(i + 1) % 4], 0.2)
  }
}

// ---------- Lon Lon Ranch
export const FENCE = []
export const RANCH_GATE = {}
export const HAY = [[25, -10], [27.4, -11.8], [24.2, -13.4], [52, -2], [18, 2]]
export const COWS = [{ x: 50, z: 12, rot: 2.2 }, { x: 54, z: 5, rot: -0.6 }, { x: 47, z: 19, rot: 0.9 }]
{
  const { c, r, gate } = RANCH
  const n = 84
  for (let k = 0; k < n; k++) {
    const t0 = (k / n) * TAU
    const t1 = ((k + 1) / n) * TAU
    if (Math.abs(wrapAngle((t0 + t1) / 2)) < gate) continue
    const p0 = [c[0] + r * Math.sin(t0), c[1] + r * Math.cos(t0)]
    const p1 = [c[0] + r * Math.sin(t1), c[1] + r * Math.cos(t1)]
    FENCE.push([p0, p1])
    seg(p0, p1, 0.3)
  }
  Object.assign(RANCH_GATE, { x: c[0], z: c[1] + r * Math.cos(gate), rot: 0, width: 2 * r * Math.sin(gate) })
  building({ x: 42, z: -22, w: 16, d: 10, h: 6.5, roofH: 4, wall: 'barn', roof: 'roofDark', kind: 'barn' })
  building({ x: 20, z: -21, w: 9, d: 8, h: 4.2, wall: 'plaster', roof: 'roofBrown' })
  tower({ x: 55, z: -11, r: 3, h: 12, y0: RANCH.h - 1, mat: 'silo', roof: 'dome', roofH: 3 })
  for (const [x, z] of HAY) circ(x, z, 0.9)
  for (const cow of COWS) circ(cow.x, cow.z, 1.2)
}

// ---------- Kakariko Village
export const WINDMILL = {}
export const WELL = { x: VILLAGE.c[0], z: VILLAGE.c[1] }
{
  const [vx, vz] = VILLAGE.c
  const roofs = ['roofRed', 'roofBrown', 'roofBlue', 'roofRed', 'roofBrown', 'roofBlue']
  ;[0.25, 1.0, 1.75, 3.2, 3.95, 5.55].forEach((th, k) =>
    building({ x: vx + 21 * Math.sin(th), z: vz + 21 * Math.cos(th), w: 8, d: 7, h: 4.2, rot: th + Math.PI, roof: roofs[k], wall: k % 2 ? 'plaster' : 'plasterWarm' }),
  )
  const th = 2.48
  Object.assign(WINDMILL, { x: vx + 21 * Math.sin(th), z: vz + 21 * Math.cos(th), rot: th + Math.PI })
  circ(WINDMILL.x, WINDMILL.z, 4.2)
  circ(WELL.x, WELL.z, 1.8)
}

// ---------- Gerudo canyon: red rock mesas either side of the road west
export const MESAS = []
export const CANYON_GATE = { x: -195, z: -12, rot: Math.PI / 2, width: 9 }
{
  const r = rng(7)
  for (let k = 0; k < 160 && MESAS.length < 16; k++) {
    const x = -142 - r() * 75
    const z = -125 + r() * 240
    const rad = 5 + r() * 8
    const h = 14 + r() * 28
    if (Math.abs(z + 12) < 13 + rad) continue
    if (Math.hypot(x, z) > WORLD_R + 30) continue
    if (MESAS.some((m) => Math.hypot(m.x - x, m.z - z) < (m.r + rad) * 1.05)) continue
    MESAS.push({ x, z, r: rad, h })
    circ(x, z, rad * 0.92)
  }
  for (const s of [-1, 1]) circ(CANYON_GATE.x, CANYON_GATE.z + (s * CANYON_GATE.width) / 2, 0.45)
}
for (const s of [-1, 1]) circ(RANCH_GATE.x + (s * RANCH_GATE.width) / 2, RANCH_GATE.z, 0.4)

// ---------- bridges: deck height runs smoothly from bank to bank with a gentle arch
export const BRIDGES = []
function bridge(A, B, w, kind = 'wood', railEnd = 1) {
  const dx = B[0] - A[0]
  const dz = B[1] - A[1]
  const len = Math.hypot(dx, dz)
  const u = [dx / len, dz / len]
  const n = [-u[1], u[0]]
  const yA = heightAt(A[0], A[1])
  const yB = heightAt(B[0], B[1])
  const arch = kind === 'draw' ? 0 : Math.max(0.35, WATER + 1.1 - (yA + yB) / 2)
  const yAt = (t) => yA + (yB - yA) * t + arch * Math.sin(Math.PI * t)
  const b = { A, B, w, kind, len, u, n, yAt, railEnd }
  b.deckAt = (x, z) => {
    const px = x - A[0]
    const pz = z - A[1]
    const s = px * u[0] + pz * u[1]
    if (s < 0 || s > len) return null
    if (Math.abs(px * n[0] + pz * n[1]) > w / 2 + 0.1) return null
    return yAt(s / len) + 0.15
  }
  for (const side of [-1, 1]) {
    const o = [(n[0] * side * w) / 2, (n[1] * side * w) / 2]
    seg([A[0] + o[0], A[1] + o[1]], [A[0] + u[0] * len * railEnd + o[0], A[1] + u[1] * len * railEnd + o[1]], 0.2)
  }
  BRIDGES.push(b)
  return b
}
bridge([0, -107], [0, -128], 7, 'draw', 0.78) // drawbridge over the moat, through the gate
bridge([LAKE.c[0], 112], [LAKE.c[0], LAKE.island.c[1] - 5], 3.6) // long walk out to the island
// wherever a road crosses the river
for (const p of PATHS) {
  for (let i = 0; i < p.length - 1; i++) {
    for (let k = 0; k < RIVER.length - 1; k++) {
      const [a, b] = [p[i], p[i + 1]]
      const [c, d] = [RIVER[k], RIVER[k + 1]]
      const den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0])
      if (Math.abs(den) < 1e-9) continue
      const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den
      const s = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den
      if (t < 0 || t > 1 || s < 0 || s > 1) continue
      const X = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
      const l = Math.hypot(b[0] - a[0], b[1] - a[1])
      const u = [(b[0] - a[0]) / l, (b[1] - a[1]) / l]
      bridge([X[0] - u[0] * 10, X[1] - u[1] * 10], [X[0] + u[0] * 10, X[1] + u[1] * 10], 4)
    }
  }
}

// ---------- signposts (rot 0 = readable from the south, looking north)
export const SIGNS = [
  { x: -1.5, z: 46, rot: 0, lines: ['↑ Hyrule Castle', '→ Lon Lon Ranch', '↓ Lake Hylia'] },
  { x: -6, z: 7, rot: 0, lines: ['← Gerudo Valley', '↑ Hyrule Castle'] },
  { x: 0, z: -54, rot: 0, lines: ['↑ Hyrule Castle', '→ Kakariko Village'] },
  { x: 13, z: 37, rot: 0, lines: ['↗ Kokiri Forest', '↑ Lon Lon Ranch'] },
  { x: -18, z: 91, rot: Math.PI, lines: ['↗ Lake Hylia'] },
  { x: 97, z: -95, rot: -Math.PI / 2, lines: ['Kakariko', 'Village'] },
  { x: 117, z: 88, rot: -2.14, lines: ['Kokiri Forest'] },
  { x: 7, z: -102, rot: 0, lines: ['Hyrule Castle', 'Town'] },
]
for (const s of SIGNS) circ(s.x, s.z, 0.35)

// ---------- rupees to collect
export const RUPEES = []
const rupee = (x, z, kind = 'green') => RUPEES.push({ id: RUPEES.length, x, z, kind })
rupee(-8, 68) // the first one, right in front of you
rupee(-20, -140)
rupee(20, -140)
rupee(0, -152, 'blue')
rupee(-22, -172, 'red')
rupee(0, -116, 'blue') // on the drawbridge
rupee(33, 6, 'blue') // middle of the horse track
rupee(28, -10)
rupee(48, -8)
rupee(125, -99)
rupee(112, -112)
rupee(140, -110, 'blue')
rupee(150, 100, 'red') // at the foot of the Great Deku Tree
rupee(130, 72)
rupee(-26, 163, 'red') // on the island
rupee(LAKE.c[0], 136, 'blue') // halfway down the lake bridge
rupee(-48, 116)
rupee(-190, -12, 'red') // by the canyon gate
rupee(-165, -8)
rupee(-145, -16, 'blue')
for (const b of BRIDGES.slice(2)) rupee((b.A[0] + b.B[0]) / 2, (b.A[1] + b.B[1]) / 2, 'blue')

export function clearOf(x, z, pad) {
  for (const c of CIRCLES) if (Math.hypot(c.x - x, c.z - z) < c.r + pad) return false
  for (const s of SEGS) if (segDist(x, z, s.a, s.b) < pad + s.t / 2) return false
  return true
}
{
  const r = rng(21)
  let placed = 0
  for (let k = 0; k < 2000 && placed < 34; k++) {
    const a = r() * TAU
    const d = Math.sqrt(r()) * 185
    const x = Math.sin(a) * d
    const z = Math.cos(a) * d
    if (heightAt(x, z) < WATER + 0.6) continue
    if (rectDist(x, z, CASTLE) < 16) continue
    if (RUPEES.some((q) => Math.hypot(q.x - x, q.z - z) < 20)) continue
    if (!clearOf(x, z, 2)) continue
    rupee(x, z, placed % 6 === 5 ? 'blue' : 'green')
    placed++
  }
}

// ---------- trees and rocks
export const TREES = []
export const ROCKS = []
const tree = (x, z, s, kind) => {
  TREES.push({ x, z, s, kind })
  circ(x, z, 0.45 * s)
}
tree(LAKE.island.c[0] + 3, LAKE.island.c[1] + 3, 1.7, 'round')
tree(-22, -131, 0.8, 'round')
tree(22, -131, 0.8, 'round')
circ(DEKU.c[0], DEKU.c[1], DEKU.r + 1)

function openGround(x, z, pad) {
  if (Math.hypot(x, z) > WORLD_R - 2) return false
  if (heightAt(x, z) < WATER + 0.8) return false
  if (polyDist(x, z, RIVER) < 7) return false
  if (pathDist(x, z) < 4 + pad) return false
  if (rectDist(x, z, CASTLE) < 16 + pad) return false
  if (Math.hypot(x - RANCH.c[0], z - RANCH.c[1]) < RANCH.r + 4 + pad) return false
  if (Math.hypot(x - VILLAGE.c[0], z - VILLAGE.c[1]) < VILLAGE.r + 4 + pad) return false
  if (Math.hypot(x - DEKU.c[0], z - DEKU.c[1]) < 16) return false
  if (RUPEES.some((q) => Math.hypot(q.x - x, q.z - z) < 3)) return false
  for (const s of SIGNS) if (Math.hypot(s.x - x, s.z - z) < 3) return false
  return clearOf(x, z, 1 + pad)
}
{
  const r = rng(5)
  // Kokiri Forest: dense, mostly pines
  for (let k = 0; k < 700 && TREES.length < 300; k++) {
    const a = r() * TAU
    const d = Math.sqrt(r()) * (FOREST.r + 15)
    const x = FOREST.c[0] + Math.sin(a) * d
    const z = FOREST.c[1] + Math.cos(a) * d
    if (!openGround(x, z, 0)) continue
    if (TREES.some((t) => Math.hypot(t.x - x, t.z - z) < 3.4)) continue
    tree(x, z, 0.9 + r() * 0.6, r() < 0.65 ? 'pine' : 'round')
  }
  // lone trees and small groves out in the field
  const fieldStart = TREES.length
  for (let k = 0; k < 900 && TREES.length < fieldStart + 120; k++) {
    const a = r() * TAU
    const d = Math.sqrt(r()) * 196
    let x = Math.sin(a) * d
    let z = Math.cos(a) * d
    if (x < CANYON_X + 5) continue
    if (Math.hypot(x - FOREST.c[0], z - FOREST.c[1]) < FOREST.r + 15) continue
    if (r() < 0.35 && TREES.length > fieldStart) {
      // grove: cluster near the last field tree
      const t = TREES[TREES.length - 1]
      x = t.x + (r() - 0.5) * 14
      z = t.z + (r() - 0.5) * 14
    }
    if (!openGround(x, z, 1)) continue
    if (TREES.some((t) => Math.hypot(t.x - x, t.z - z) < 5)) continue
    tree(x, z, 0.8 + r() * 0.7, r() < 0.2 ? 'pine' : 'round')
  }
  for (let k = 0; k < 600 && ROCKS.length < 70; k++) {
    const a = r() * TAU
    const d = Math.sqrt(r()) * 197
    const x = Math.sin(a) * d
    const z = Math.cos(a) * d
    if (!openGround(x, z, 0)) continue
    const s = 0.5 + r() * r() * 2.4
    ROCKS.push({ x, z, s, rot: r() * TAU })
    if (s > 0.9) circ(x, z, s * 0.85)
  }
}

// bounding boxes for fast rejection
for (const s of SEGS) {
  s.minx = Math.min(s.a[0], s.b[0])
  s.maxx = Math.max(s.a[0], s.b[0])
  s.minz = Math.min(s.a[1], s.b[1])
  s.maxz = Math.max(s.a[1], s.b[1])
}

export function collide(pos) {
  for (let it = 0; it < 3; it++) {
    for (const s of SEGS) {
      const rr = R_PLAYER + s.t / 2
      if (pos.x < s.minx - rr || pos.x > s.maxx + rr || pos.z < s.minz - rr || pos.z > s.maxz + rr) continue
      const dx = s.b[0] - s.a[0]
      const dz = s.b[1] - s.a[1]
      const l2 = dx * dx + dz * dz
      let u = l2 > 0 ? ((pos.x - s.a[0]) * dx + (pos.z - s.a[1]) * dz) / l2 : 0
      u = Math.max(0, Math.min(1, u))
      const ex = pos.x - (s.a[0] + dx * u)
      const ez = pos.z - (s.a[1] + dz * u)
      const d = Math.hypot(ex, ez)
      if (d < rr && d > 1e-6) {
        pos.x += (ex / d) * (rr - d)
        pos.z += (ez / d) * (rr - d)
      }
    }
    for (const c of CIRCLES) {
      const rr = R_PLAYER + c.r
      const dx = pos.x - c.x
      if (dx > rr || dx < -rr) continue
      const dz = pos.z - c.z
      if (dz > rr || dz < -rr) continue
      const d = Math.hypot(dx, dz)
      if (d < rr && d > 1e-6) {
        pos.x = c.x + (dx / d) * rr
        pos.z = c.z + (dz / d) * rr
      }
    }
  }
  const r = Math.hypot(pos.x, pos.z)
  if (r > WORLD_R) {
    pos.x *= WORLD_R / r
    pos.z *= WORLD_R / r
  }
  return pos
}

// ground under a point: terrain, bridge decks, or the bottom of shallow water (you wade)
export function floorAt(x, z) {
  let h = Math.max(heightAt(x, z), WATER - 1.05)
  for (const b of BRIDGES) {
    const y = b.deckAt(x, z)
    if (y !== null && y > h) h = y
  }
  return h
}
export const inWater = (x, z) => floorAt(x, z) < WATER - 0.2

export function locate(x, z) {
  const dc = rectDist(x, z, CASTLE)
  if (dc < 0) return z < KEEP.z + KEEP.d / 2 + 5 && Math.abs(x - KEEP.x) < KEEP.w / 2 + 6 ? 'Hyrule Castle' : 'Castle Town'
  if (dc < 18 && Math.abs(x) < 5 && z > CASTLE.z1) return 'Castle Drawbridge'
  if (dc < 14) return 'Castle Moat'
  if (Math.hypot(x - RANCH.c[0], z - RANCH.c[1]) < RANCH.r) return 'Lon Lon Ranch'
  if (Math.hypot(x - VILLAGE.c[0], z - VILLAGE.c[1]) < VILLAGE.r + 6) return 'Kakariko Village'
  if (Math.hypot(x - DEKU.c[0], z - DEKU.c[1]) < 22) return 'Great Deku Tree'
  if (polyDist(x, z, RIVER) < 9) return "Zora's River"
  if (Math.hypot(x - FOREST.c[0], z - FOREST.c[1]) < FOREST.r) return 'Kokiri Forest'
  if (Math.hypot(x - LAKE.island.c[0], z - LAKE.island.c[1]) < LAKE.island.r + 2) return 'Lake Hylia · Island'
  if (Math.hypot(x - LAKE.c[0], z - LAKE.c[1]) < LAKE.r + 4) return 'Lake Hylia'
  if (x < CANYON_X) return 'Gerudo Valley'
  if (Math.hypot(x, z) > WORLD_R - 10) return 'Edge of Hyrule Field'
  return 'Hyrule Field'
}
