// Procedural canvas textures. Unless noted, one texture tile covers 4 m (see geo.js TILE).
import * as THREE from 'three'
import { rng } from './terrain.js'

function canvas(w, h = w) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')]
}
function tex(c, repeat = [1, 1]) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(...repeat)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
const rgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
const shade = (hex, f) => {
  const [r, g, b] = rgb(hex)
  return `rgb(${Math.min(255, r * f) | 0},${Math.min(255, g * f) | 0},${Math.min(255, b * f) | 0})`
}
function speckle(g, w, h, n, seed, alpha = 0.08) {
  const r = rng(seed)
  for (let i = 0; i < n; i++) {
    g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`
    g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3)
  }
}

// cut-stone blocks, 0.5 m courses
export function stoneTex(base) {
  const [c, g] = canvas(512)
  const r = rng(3)
  g.fillStyle = shade(base, 0.62)
  g.fillRect(0, 0, 512, 512)
  for (let y = 0, row = 0; y < 512; y += 64, row++) {
    let x = row % 2 ? -70 : 0
    while (x < 512) {
      const w = 90 + r() * 80
      g.fillStyle = shade(base, 0.86 + r() * 0.22)
      for (const off of [0, 512]) g.fillRect(x + 3 - off, y + 3, w - 6, 58)
      g.fillStyle = 'rgba(255,255,255,0.10)'
      for (const off of [0, 512]) g.fillRect(x + 3 - off, y + 3, w - 6, 6)
      x += w
    }
  }
  speckle(g, 512, 512, 2500, 4)
  return tex(c)
}

// vertical boards, 25 cm wide
export function plankTex(base) {
  const [c, g] = canvas(512)
  const r = rng(8)
  for (let x = 0; x < 512; x += 32) {
    g.fillStyle = shade(base, 0.85 + r() * 0.25)
    g.fillRect(x, 0, 32, 512)
    g.fillStyle = 'rgba(0,0,0,0.35)'
    g.fillRect(x, 0, 2, 512)
    g.strokeStyle = 'rgba(0,0,0,0.12)'
    for (let k = 0; k < 3; k++) {
      g.beginPath()
      const gx = x + 6 + r() * 20
      g.moveTo(gx, 0)
      for (let y = 0; y <= 512; y += 32) g.lineTo(gx + Math.sin(y / 40 + k) * 2, y)
      g.stroke()
    }
  }
  return tex(c)
}

// roof shingles; one tile = 2 m (roofGeo uses tile 2)
export function roofTex(base) {
  const [c, g] = canvas(256)
  const r = rng(11)
  g.fillStyle = shade(base, 0.7)
  g.fillRect(0, 0, 256, 256)
  for (let y = 0, row = 0; y < 256; y += 32, row++) {
    for (let x = row % 2 ? -16 : 0; x < 256; x += 32) {
      const grd = g.createLinearGradient(0, y, 0, y + 32)
      const f = 0.9 + r() * 0.2
      grd.addColorStop(0, shade(base, 1.08 * f))
      grd.addColorStop(1, shade(base, 0.72 * f))
      g.fillStyle = grd
      g.fillRect(x + 1, y + 1, 30, 30)
    }
  }
  return tex(c)
}

export function plasterTex(base) {
  const [c, g] = canvas(256)
  g.fillStyle = base
  g.fillRect(0, 0, 256, 256)
  speckle(g, 256, 256, 1800, 9, 0.05)
  return tex(c)
}

// ripples, multiplied over the water color
export function waterTex() {
  const [c, g] = canvas(256)
  const r = rng(13)
  g.fillStyle = '#c8d4dc'
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 90; i++) {
    const x = r() * 256
    const y = r() * 256
    const w = 10 + r() * 30
    g.strokeStyle = `rgba(255,255,255,${0.35 + r() * 0.5})`
    g.lineWidth = 1.5 + r() * 2
    for (const ox of [0, -256, 256]) {
      for (const oy of [0, -256, 256]) {
        g.beginPath()
        g.ellipse(x + ox, y + oy, w, w * 0.18, 0, Math.PI * 1.1, Math.PI * 1.9)
        g.stroke()
      }
    }
  }
  return tex(c, [70, 70])
}

export function glowTex() {
  const [c, g] = canvas(128)
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.25, 'rgba(255,255,255,0.75)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// carved wooden sign; aspect = board width / height
export function signTex(lines, aspect) {
  const W = 512
  const H = Math.round(W / aspect)
  const [c, g] = canvas(W, H)
  g.fillStyle = '#a8773f'
  g.fillRect(0, 0, W, H)
  const r = rng(lines.join('').length)
  g.strokeStyle = 'rgba(60,30,10,0.25)'
  for (let i = 0; i < 14; i++) {
    g.beginPath()
    const y = r() * H
    g.moveTo(0, y)
    g.bezierCurveTo(W * 0.3, y + 6, W * 0.6, y - 6, W, y + 2)
    g.stroke()
  }
  g.strokeStyle = '#5a3415'
  g.lineWidth = 10
  g.strokeRect(5, 5, W - 10, H - 10)
  const size = Math.min(58, (H - 30) / lines.length / 1.15)
  g.font = `bold ${size}px Georgia, 'Times New Roman', serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  lines.forEach((l, i) => {
    const y = H / 2 + (i - (lines.length - 1) / 2) * size * 1.15
    g.fillStyle = 'rgba(255,230,180,0.35)'
    g.fillText(l, W / 2 + 1.5, y + 2)
    g.fillStyle = '#2b170a'
    g.fillText(l, W / 2, y)
  })
  return tex(c)
}

export function bannerTex() {
  const [c, g] = canvas(128, 256)
  g.fillStyle = '#b3242c'
  g.fillRect(0, 0, 128, 256)
  g.fillStyle = '#e7c04a'
  g.fillRect(0, 0, 128, 14)
  g.fillRect(10, 20, 6, 220)
  g.fillRect(112, 20, 6, 220)
  // a simple gold bird crest
  g.beginPath()
  g.moveTo(64, 70)
  g.lineTo(100, 110)
  g.lineTo(76, 108)
  g.lineTo(64, 150)
  g.lineTo(52, 108)
  g.lineTo(28, 110)
  g.closePath()
  g.fill()
  // swallowtail
  g.globalCompositeOperation = 'destination-out'
  g.beginPath()
  g.moveTo(0, 256)
  g.lineTo(64, 214)
  g.lineTo(128, 256)
  g.fill()
  return tex(c)
}

export function awningTex(color) {
  const [c, g] = canvas(128)
  for (let x = 0; x < 128; x += 32) {
    g.fillStyle = color
    g.fillRect(x, 0, 16, 128)
    g.fillStyle = '#f6f1e4'
    g.fillRect(x + 16, 0, 16, 128)
  }
  return tex(c)
}
