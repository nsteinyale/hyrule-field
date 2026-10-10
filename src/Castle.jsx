import { useMemo } from 'react'
import * as THREE from 'three'
import { CASTLE, KEEP } from './places.js'
import { FOUNTAIN, STALLS, TOWERS } from './layout.js'
import { Beam, Instanced, boxGeo, cylGeo } from './geo.jsx'
import { M, awnings } from './materials.js'

const BOX = new THREE.BoxGeometry(1, 1, 1)
const { x0, x1, z0, z1, h: G, wallH, wallT, gate } = CASTLE
const TOP = G + wallH // wall-walk height

function Wall({ a, b, y0 = 0, y1 = TOP, t = wallT, mat = M.stone }) {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const len = Math.hypot(dx, dz)
  const geo = useMemo(() => boxGeo(len, y1 - y0, t), [len, y0, y1, t])
  return <mesh geometry={geo} material={mat} position={[(a[0] + b[0]) / 2, (y0 + y1) / 2, (a[1] + b[1]) / 2]} rotation={[0, -Math.atan2(dz, dx), 0]} />
}

// battlements along the top of each wall, skipping the corner towers
function Merlons() {
  const items = useMemo(() => {
    const out = []
    const sides = [
      [[x0, z0], [x1, z0]],
      [[x0, z0], [x0, z1]],
      [[x1, z0], [x1, z1]],
      [[x0, z1], [x1, z1]],
    ]
    const corners = TOWERS.filter((t) => t.r > 5 || t.banner)
    for (const [a, b] of sides) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const rot = -Math.atan2(b[1] - a[1], b[0] - a[0])
      for (let s = 1.3; s < len; s += 2.6) {
        const x = a[0] + ((b[0] - a[0]) * s) / len
        const z = a[1] + ((b[1] - a[1]) * s) / len
        if (corners.some((t) => Math.hypot(t.x - x, t.z - z) < t.r + 0.8)) continue
        out.push({ p: [x, TOP + 0.7, z], s: [1.3, 1.4, wallT + 0.15], r: rot })
      }
    }
    return out
  }, [])
  return <Instanced items={items} geometry={BOX} material={M.stone} />
}

function Keep() {
  const { x, z, w, d, h } = KEEP
  const body = useMemo(() => boxGeo(w, h + 2, d), [w, h, d])
  const upper = useMemo(() => boxGeo(w * 0.55, 7, d * 0.7), [w, d])
  const windows = useMemo(() => {
    const out = []
    for (let wx = -w / 2 + 3; wx <= w / 2 - 3; wx += 3.6) {
      if (Math.abs(wx) < 3) continue
      for (const wy of [G + 6, G + 11]) out.push({ p: [x + wx, wy, z + d / 2 + 0.06], s: [1, 2, 0.1] })
    }
    for (let wx = -w * 0.2; wx <= w * 0.2 + 0.1; wx += 3.2) out.push({ p: [x + wx, G + h + 3.5, z + d * 0.35 + 0.06], s: [0.9, 1.8, 0.1] })
    return out
  }, [x, z, w, d, h])
  return (
    <>
      <mesh geometry={body} material={M.keep} position={[x, G - 1 + (h + 2) / 2, z]} />
      <mesh geometry={upper} material={M.keep} position={[x, G + h + 3.5, z]} />
      <Instanced items={windows} geometry={BOX} material={M.window} />
      {/* great door */}
      <mesh position={[x, G + 3, z + d / 2 + 0.06]} material={M.darkWood}>
        <boxGeometry args={[4, 6, 0.1]} />
      </mesh>
      <mesh position={[x, G + 6, z + d / 2 + 0.06]} rotation={[Math.PI / 2, 0, 0]} material={M.darkWood}>
        <cylinderGeometry args={[2, 2, 0.1, 16, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
      {/* steps up to the door */}
      <mesh position={[x, G + 0.15, z + d / 2 + 1.5]} material={M.keep}>
        <boxGeometry args={[8, 0.3, 3]} />
      </mesh>
    </>
  )
}

function Fountain() {
  const { x, z, r } = FOUNTAIN
  const basin = useMemo(() => cylGeo(r, r + 0.2, 0.9, 24), [r])
  const pillar = useMemo(() => cylGeo(0.45, 0.6, 2.4, 10), [])
  return (
    <group position={[x, G, z]}>
      <mesh geometry={basin} material={M.stone} position={[0, 0.45, 0]} />
      <mesh material={M.water} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.75, 0]}>
        <circleGeometry args={[r - 0.25, 24]} />
      </mesh>
      <mesh geometry={pillar} material={M.stone} position={[0, 1.2, 0]} />
      <mesh material={M.stone} position={[0, 2.5, 0]}>
        <cylinderGeometry args={[1.4, 0.35, 0.5, 14]} />
      </mesh>
      <mesh material={M.water} position={[0, 2.76, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.25, 14]} />
      </mesh>
    </group>
  )
}

// market stalls around the plaza: four posts, a counter, a striped awning
function Stall({ s }) {
  return (
    <group position={[s.x, G, s.z]} rotation={[0, s.rot, 0]}>
      {[[-1.4, -0.9], [1.4, -0.9], [-1.4, 0.9], [1.4, 0.9]].map(([px, pz]) => (
        <mesh key={`${px}${pz}`} position={[px, 1.2, pz]} material={M.darkWood}>
          <boxGeometry args={[0.15, 2.4, 0.15]} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0.7]} material={M.wood}>
        <boxGeometry args={[2.9, 1, 0.6]} />
      </mesh>
      <mesh position={[0, 2.55, 0.15]} rotation={[-1.25, 0, 0]} material={awnings[s.color]}>
        <planeGeometry args={[3.3, 2.6]} />
      </mesh>
      {[-0.8, 0, 0.8].map((px, i) => (
        <mesh key={px} position={[px, 1.15, 0.7]}>
          <sphereGeometry args={[0.17, 8, 6]} />
          <meshLambertMaterial color={['#e04a3a', '#f2b632', '#7cc242'][i]} />
        </mesh>
      ))}
    </group>
  )
}

export default function Castle() {
  return (
    <>
      <Wall a={[x0, z0]} b={[x1, z0]} />
      <Wall a={[x0, z0]} b={[x0, z1]} />
      <Wall a={[x1, z0]} b={[x1, z1]} />
      <Wall a={[x0, z1]} b={[-gate, z1]} />
      <Wall a={[gate, z1]} b={[x1, z1]} />
      <Wall a={[-gate, z1]} b={[gate, z1]} y0={G + 7.2} />
      <Merlons />
      <Keep />
      <Fountain />
      {STALLS.map((s, i) => (
        <Stall key={i} s={s} />
      ))}
      {/* drawbridge chains, from the bridge's outer end up to the gatehouse */}
      {[-1, 1].map((s) => (
        <Beam key={s} a={[s * 3.2, G + 0.3, z1 + 16]} b={[s * 3.2, G + 9.5, z1 + 1.3]} w={0.12} material={M.iron} />
      ))}
      {/* dark gate tunnel so the opening reads as an arch */}
      <mesh position={[0, G + 7.25, z1]} material={M.window}>
        <boxGeometry args={[gate * 2, 0.1, wallT + 0.05]} />
      </mesh>
    </>
  )
}
