import { CANYON_X, CASTLE, FOREST, LAKE, MOUNTAIN, PATHS, RANCH, RIVER, VILLAGE, WATER, WORLD_R } from './places.js'

// Heightfield on a regular grid. Terrain.jsx builds its mesh from the same grid with the same
// triangle split, so heightAt() is exactly the ground you see.
export const SIZE = 800
export const N = 320 // cells per side (2.5 m each)
export const CELL = SIZE / N
export const HALF = SIZE / 2
export const W1 = N + 1

// ---------- small math kit
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export function hash(x, z) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(z | 0, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const fade = (t) => t * t * (3 - 2 * t)
export function noise(x, z) {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = fade(x - ix)
  const fz = fade(z - iz)
  const a = hash(ix, iz)
  const b = hash(ix + 1, iz)
  const c = hash(ix, iz + 1)
  const d = hash(ix + 1, iz + 1)
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz
}
export const fbm = (x, z) =>
  noise(x, z) * 0.55 + noise(x * 2.03 + 17.1, z * 2.03 - 9.3) * 0.3 + noise(x * 4.1 - 5.7, z * 4.1 + 31.2) * 0.15
// smoothstep that also runs "backwards" when a > b
export const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
export const lerp = (a, b, t) => a + (b - a) * t

export function segDist(x, z, a, b) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const l2 = dx * dx + dz * dz
  let t = l2 > 0 ? ((x - a[0]) * dx + (z - a[1]) * dz) / l2 : 0
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)
}
export function polyDist(x, z, pts) {
  let m = Infinity
  for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, segDist(x, z, pts[i], pts[i + 1]))
  return m
}
export function pathDist(x, z) {
  let m = Infinity
  for (const p of PATHS) m = Math.min(m, polyDist(x, z, p))
  return m
}
// signed distance to a rectangle {x0, x1, z0, z1}: negative inside
export function rectDist(x, z, r) {
  const dx = Math.max(r.x0 - x, 0, x - r.x1)
  const dz = Math.max(r.z0 - z, 0, z - r.z1)
  if (dx > 0 || dz > 0) return Math.hypot(dx, dz)
  return -Math.min(x - r.x0, r.x1 - x, z - r.z0, r.z1 - z)
}

// ---------- the landscape
function shape(x, z) {
  // rolling field
  let h = 3 + (fbm(x / 75, z / 75) - 0.5) * 9 + (noise(x / 18 + 40, z / 18 - 3) - 0.5) * 1.6
  // flat spots for the ranch, the village shelf and the castle
  const flat = (d, r, b, target) => {
    h = lerp(target, h, smooth(r, r + b, d))
  }
  flat(Math.hypot(x - RANCH.c[0], z - RANCH.c[1]), RANCH.r + 3, 22, RANCH.h)
  flat(Math.hypot(x - VILLAGE.c[0], z - VILLAGE.c[1]), VILLAGE.r + 4, 28, VILLAGE.h)
  const dc = rectDist(x, z, CASTLE)
  flat(dc, 14, 26, CASTLE.h)
  // river: a shallow valley with a channel down the middle
  const dr = polyDist(x, z, RIVER)
  h = lerp(0.9, h, smooth(7, 24, dr))
  h = lerp(-1.8, h, smooth(2.5, 5.5, dr))
  // lake bowl with a wobbly shore, plus the island
  const dl = Math.hypot(x - LAKE.c[0], z - LAKE.c[1]) + (noise(x / 9, z / 9) - 0.5) * 6
  h = lerp(-3.5, h, smooth(LAKE.r - 10, LAKE.r + 8, dl))
  const di = Math.hypot(x - LAKE.island.c[0], z - LAKE.island.c[1])
  h = Math.max(h, lerp(1.8, -3.5, smooth(LAKE.island.r - 3, LAKE.island.r + 3, di)))
  // castle moat
  if (dc > 0) h = lerp(h, -2.2, smooth(2, 5, dc) * smooth(13, 10, dc))
  // cliffs and peaks ring the field
  const r = Math.hypot(x, z)
  const rim = Math.max(0, r - (WORLD_R - 6)) / 45
  if (rim > 0) {
    const k = 1 - Math.exp(-rim * rim * 2)
    h += k * (70 + 90 * fbm(x / 60 + 9, z / 60 - 4))
  }
  // Death Mountain, with a crater on top
  const dm = Math.hypot(x - MOUNTAIN.c[0], z - MOUNTAIN.c[1])
  if (dm < MOUNTAIN.r) {
    let m = MOUNTAIN.h * Math.pow(1 - dm / MOUNTAIN.r, 1.25) + (noise(x / 14, z / 14) - 0.5) * 8
    if (dm < 18) m -= Math.pow(1 - dm / 18, 2) * 26
    h = Math.max(h, m)
  }
  return h
}

export const HEIGHTS = new Float32Array(W1 * W1)
for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) HEIGHTS[j * W1 + i] = shape(-HALF + i * CELL, -HALF + j * CELL)

// same split as the mesh: each cell is (i,j)(i,j+1)(i+1,j) + (i+1,j)(i,j+1)(i+1,j+1)
export function heightAt(x, z) {
  const fx = Math.min(N - 1e-6, Math.max(0, (x + HALF) / CELL))
  const fz = Math.min(N - 1e-6, Math.max(0, (z + HALF) / CELL))
  const i = Math.floor(fx)
  const j = Math.floor(fz)
  const u = fx - i
  const v = fz - j
  const h00 = HEIGHTS[j * W1 + i]
  const h10 = HEIGHTS[j * W1 + i + 1]
  const h01 = HEIGHTS[(j + 1) * W1 + i]
  const h11 = HEIGHTS[(j + 1) * W1 + i + 1]
  if (u + v <= 1) return h00 + u * (h10 - h00) + v * (h01 - h00)
  return h11 + (1 - u) * (h01 - h11) + (1 - v) * (h10 - h11)
}
export const gridIndex = (x, z) => {
  const i = Math.max(0, Math.min(N, Math.round((x + HALF) / CELL)))
  const j = Math.max(0, Math.min(N, Math.round((z + HALF) / CELL)))
  return j * W1 + i
}

// ---------- ground colors (sRGB 0..1), shared by the 3D terrain and the minimap
const hex = (s) => [parseInt(s.slice(1, 3), 16) / 255, parseInt(s.slice(3, 5), 16) / 255, parseInt(s.slice(5, 7), 16) / 255]
const P = {
  grassA: hex('#5c9c33'),
  grassB: hex('#8fc24c'),
  forest: hex('#3a7128'),
  dirt: hex('#b98d5b'),
  sand: hex('#e1cd92'),
  canyon: hex('#d89b5a'),
  rock: hex('#8a8072'),
  redRock: hex('#b2623b'),
  dark: hex('#5a4535'),
  lava: hex('#c4421d'),
  cobble: hex('#aca395'),
  bed: hex('#6d7d52'),
  plaza: hex('#c9a878'),
}
const mix = (c, d, t) => (t <= 0 ? c : [c[0] + (d[0] - c[0]) * t, c[1] + (d[1] - c[1]) * t, c[2] + (d[2] - c[2]) * t])

export const COLORS = new Float32Array(W1 * W1 * 3)
export const GRASSY = new Uint8Array(W1 * W1) // where grass tufts and flowers may grow
for (let j = 0; j <= N; j++) {
  for (let i = 0; i <= N; i++) {
    const k = j * W1 + i
    const x = -HALF + i * CELL
    const z = -HALF + j * CELL
    const h = HEIGHTS[k]
    const hx = (HEIGHTS[j * W1 + Math.min(N, i + 1)] - HEIGHTS[j * W1 + Math.max(0, i - 1)]) / (2 * CELL)
    const hz = (HEIGHTS[Math.min(N, j + 1) * W1 + i] - HEIGHTS[Math.max(0, j - 1) * W1 + i]) / (2 * CELL)
    const slope = Math.hypot(hx, hz)
    const r = Math.hypot(x, z)

    let c = mix(P.grassA, P.grassB, smooth(0.3, 0.72, fbm(x / 28, z / 28)))
    c = mix(c, P.forest, smooth(FOREST.r + 10, FOREST.r - 15, Math.hypot(x - FOREST.c[0], z - FOREST.c[1])))
    c = mix(c, P.canyon, smooth(CANYON_X + 20, CANYON_X - 20, x))
    const track = Math.abs(Math.hypot(x - RANCH.track.c[0], z - RANCH.track.c[1]) - RANCH.track.r)
    c = mix(c, P.dirt, smooth(3, 2, track))
    const plaza = Math.hypot(x - VILLAGE.c[0], z - VILLAGE.c[1])
    c = mix(c, P.plaza, smooth(15, 12, plaza))
    const dc = rectDist(x, z, CASTLE)
    c = mix(c, P.cobble, smooth(-1, -2, dc))
    const dp = r < WORLD_R + 10 ? pathDist(x, z) : 99
    c = mix(c, P.dirt, smooth(3.4, 2.2, dp))
    c = mix(c, P.sand, smooth(WATER + 1.2, WATER + 0.5, h))
    c = mix(c, P.bed, smooth(WATER - 0.3, WATER - 1.4, h))
    const cliff = Math.max(smooth(0.75, 1.3, slope), smooth(WORLD_R + 4, WORLD_R + 22, r))
    c = mix(c, mix(P.rock, P.redRock, smooth(CANYON_X + 70, CANYON_X - 40, x + (fbm(x / 40, z / 40) - 0.5) * 50)), cliff)
    const dm = Math.hypot(x - MOUNTAIN.c[0], z - MOUNTAIN.c[1])
    if (dm < MOUNTAIN.r) {
      c = mix(c, P.dark, Math.min(1, smooth(25, 70, h) * (1 - dm / MOUNTAIN.r) * 2.2))
      c = mix(c, P.lava, smooth(22, 10, dm))
    }
    const jitter = 0.94 + hash(i * 7 + 3, j * 13 + 1) * 0.12 // low-poly facet variety
    COLORS[k * 3] = Math.min(1, c[0] * jitter)
    COLORS[k * 3 + 1] = Math.min(1, c[1] * jitter)
    COLORS[k * 3 + 2] = Math.min(1, c[2] * jitter)

    const open =
      h > WATER + 0.5 &&
      dp > 3.2 &&
      dc > 1 &&
      track > 3 &&
      plaza > 15 &&
      slope < 0.9 &&
      r < WORLD_R + 3 &&
      (x > CANYON_X || hash(i, j) < 0.2)
    GRASSY[k] = open ? 1 : 0
  }
}
