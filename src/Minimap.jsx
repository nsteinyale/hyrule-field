import { useEffect, useRef } from 'react'
import { CASTLE, DEKU, KEEP, LAKE, RANCH, VILLAGE, WATER, WORLD_R } from './places.js'
import { BRIDGES, BUILDINGS, MESAS, RUPEES, TOWERS, toWorld } from './layout.js'
import { COLORS, HEIGHTS, gridIndex } from './terrain.js'
import { got } from './rupeeStore.js'
import { HORSE } from './Ranch.jsx'

const R = WORLD_R + 12
const Wpx = R * 2 // 1 px per meter
const px = (x, z) => [x + R, z + R]
const RUPEE_DOT = { green: '#3ef05a', blue: '#4d8dff', red: '#ff4455' }
const ROOF = { roofRed: '#b8442f', roofBrown: '#7b4b2a', roofBlue: '#3b5ea8', roofDark: '#4d4b55' }

function drawStatic(g) {
  const img = g.createImageData(Wpx, Wpx)
  for (let y = 0; y < Wpx; y++) {
    for (let x = 0; x < Wpx; x++) {
      const wx = x - R + 0.5
      const wz = y - R + 0.5
      const k = gridIndex(wx, wz)
      let c = HEIGHTS[k] < WATER ? [0.24, 0.56, 0.84] : [COLORS[k * 3], COLORS[k * 3 + 1], COLORS[k * 3 + 2]]
      if (Math.hypot(wx, wz) > WORLD_R) c = c.map((v) => v * 0.45)
      const o = (y * Wpx + x) * 4
      img.data[o] = c[0] * 255
      img.data[o + 1] = c[1] * 255
      img.data[o + 2] = c[2] * 255
      img.data[o + 3] = 255
    }
  }
  g.putImageData(img, 0, 0)

  // castle walls, keep, towers
  g.strokeStyle = '#efe6d2'
  g.lineWidth = 3
  g.strokeRect(...px(CASTLE.x0, CASTLE.z0), CASTLE.x1 - CASTLE.x0, CASTLE.z1 - CASTLE.z0)
  g.fillStyle = '#efe6d2'
  g.fillRect(...px(KEEP.x - KEEP.w / 2, KEEP.z - KEEP.d / 2), KEEP.w, KEEP.d)
  for (const t of TOWERS) {
    g.fillStyle = t.mat === 'silo' ? '#b9bcc2' : '#3b5ea8'
    g.beginPath()
    g.arc(...px(t.x, t.z), t.r, 0, Math.PI * 2)
    g.fill()
  }
  // houses as little roof-colored rectangles
  for (const b of BUILDINGS) {
    const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => px(...toWorld(b, (sx * b.w) / 2, (sz * b.d) / 2)))
    g.fillStyle = ROOF[b.roof] || '#a8322a'
    g.beginPath()
    pts.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p)))
    g.closePath()
    g.fill()
  }
  // ranch fence
  g.strokeStyle = '#6b4226'
  g.lineWidth = 1.5
  g.beginPath()
  g.arc(...px(...RANCH.c), RANCH.r, Math.PI / 2 + RANCH.gate, Math.PI * 2.5 - RANCH.gate)
  g.stroke()
  // bridges
  g.strokeStyle = '#8f5e34'
  for (const b of BRIDGES) {
    g.lineWidth = b.w
    g.beginPath()
    g.moveTo(...px(...b.A))
    g.lineTo(...px(...b.B))
    g.stroke()
  }
  // canyon mesas + the big tree
  g.fillStyle = '#9c4f2c'
  for (const m of MESAS) {
    g.beginPath()
    g.arc(...px(m.x, m.z), m.r, 0, Math.PI * 2)
    g.fill()
  }
  g.fillStyle = '#245a24'
  g.beginPath()
  g.arc(...px(...DEKU.c), 11, 0, Math.PI * 2)
  g.fill()

  // labels
  g.font = 'bold 15px Georgia, serif'
  g.textAlign = 'center'
  g.lineWidth = 4
  const label = (t, x, z) => {
    g.strokeStyle = 'rgba(20,30,15,0.85)'
    g.strokeText(t, ...px(x, z))
    g.fillStyle = '#f3d36b'
    g.fillText(t, ...px(x, z))
  }
  label('CASTLE', 0, -112)
  label('RANCH', RANCH.c[0], RANCH.c[1] - 34)
  label('KAKARIKO', VILLAGE.c[0], VILLAGE.c[1] + 42)
  label('FOREST', 150, 60)
  label('LAKE', LAKE.c[0] - 34, LAKE.c[1] - 8)
  label('GERUDO', -168, 6)
  label('N ↑', R - 26, -R + 22)
}

export default function Minimap({ drawRef }) {
  const ref = useRef()
  useEffect(() => {
    const bg = document.createElement('canvas')
    bg.width = Wpx
    bg.height = Wpx
    drawStatic(bg.getContext('2d'))
    const g = ref.current.getContext('2d')
    drawRef.current = (x, z, fx, fz) => {
      g.drawImage(bg, 0, 0)
      // rupees you haven't found yet
      for (const r of RUPEES) {
        if (got.has(r.id)) continue
        const [rx, ry] = px(r.x, r.z)
        g.fillStyle = RUPEE_DOT[r.kind]
        g.strokeStyle = '#0b1a0d'
        g.lineWidth = 1.5
        g.beginPath()
        g.moveTo(rx, ry - 5)
        g.lineTo(rx + 3.5, ry)
        g.lineTo(rx, ry + 5)
        g.lineTo(rx - 3.5, ry)
        g.closePath()
        g.fill()
        g.stroke()
      }
      // the horse
      g.fillStyle = '#8a5530'
      g.strokeStyle = '#ffffff'
      g.lineWidth = 2
      g.beginPath()
      g.arc(...px(HORSE.x, HORSE.z), 4.5, 0, Math.PI * 2)
      g.fill()
      g.stroke()
      // you: a gold arrow with a view cone
      const [cx, cy] = px(x, z)
      const a = Math.atan2(fz, fx)
      g.fillStyle = 'rgba(243,211,107,0.25)'
      g.beginPath()
      g.moveTo(cx, cy)
      g.arc(cx, cy, 40, a - 0.5, a + 0.5)
      g.closePath()
      g.fill()
      g.save()
      g.translate(cx, cy)
      g.rotate(a)
      g.fillStyle = '#f3d36b'
      g.strokeStyle = '#1a2a12'
      g.lineWidth = 2
      g.beginPath()
      g.moveTo(10, 0)
      g.lineTo(-7, 6.5)
      g.lineTo(-3, 0)
      g.lineTo(-7, -6.5)
      g.closePath()
      g.fill()
      g.stroke()
      g.restore()
    }
  }, [drawRef])
  return <canvas ref={ref} className="minimap" width={Wpx} height={Wpx} />
}
