import { useMemo } from 'react'
import * as THREE from 'three'
import { BRIDGES, BUILDINGS, CANYON_GATE, SIGNS, TOWERS } from './layout.js'
import { heightAt } from './terrain.js'
import { Instanced, boxGeo, cylGeo, roofGeo } from './geo.jsx'
import { M } from './materials.js'
import * as T from './textures.js'

const BOX = new THREE.BoxGeometry(1, 1, 1)

// plaster cottage, town house or barn: walls sink 1.5 m into the ground so slopes never show a gap
function House({ b }) {
  const SINK = 1.5
  const walls = useMemo(() => boxGeo(b.w, b.h + SINK, b.d), [b])
  const roof = useMemo(() => roofGeo(b.w, b.d, b.roofH, 0.55), [b])
  const chimney = useMemo(() => boxGeo(0.7, 2.2, 0.7), [])
  const wallMat = M[b.wall]
  const fz = b.d / 2 + 0.03
  const barn = b.kind === 'barn'
  const windows = b.w > 7 && !barn ? [-(b.w / 2 - 1.7), b.w / 2 - 1.7] : []
  return (
    <group position={[b.x, b.y, b.z]} rotation={[0, b.rot, 0]}>
      <mesh geometry={walls} material={wallMat} position={[0, (b.h + SINK) / 2 - SINK, 0]} />
      <mesh geometry={roof} material={[M[b.roof], wallMat]} position={[0, b.h, 0]} />
      {barn ? (
        <>
          <mesh position={[0, 2.4, fz]} material={M.darkWood}>
            <planeGeometry args={[4.4, 4.8]} />
          </mesh>
          {[0.83, -0.83].map((a) => (
            <mesh key={a} position={[0, 2.4, fz + 0.02]} rotation={[0, 0, a]} material={M.trim}>
              <planeGeometry args={[0.25, 6.2]} />
            </mesh>
          ))}
          <mesh position={[0, 5.6, fz + 0.01]} material={M.window}>
            <planeGeometry args={[1.6, 1.2]} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 1.05, fz]} material={M.door}>
          <planeGeometry args={[1.1, 2.1]} />
        </mesh>
      )}
      {windows.map((x) =>
        [fz, -fz].map((z) => (
          <group key={`${x}${z}`} position={[x, 2.5, z]} rotation={[0, z > 0 ? 0 : Math.PI, 0]}>
            <mesh material={M.trim}>
              <planeGeometry args={[1.15, 1.15]} />
            </mesh>
            <mesh position={[0, 0, 0.01]} material={M.window}>
              <planeGeometry args={[0.9, 0.9]} />
            </mesh>
          </group>
        )),
      )}
      {!barn && (
        <mesh geometry={chimney} material={M.stone} position={[b.w / 4, b.h + b.roofH * 0.55, -b.d / 5]} />
      )}
    </group>
  )
}

function Tower({ t }) {
  const body = useMemo(() => cylGeo(t.r, t.r * 1.05, t.h, 16), [t])
  const roof = useMemo(() => (t.roof === 'dome' ? new THREE.SphereGeometry(t.r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2) : cylGeo(0.02, t.r + 0.9, t.roofH, 16, 2)), [t])
  const top = t.y0 + t.h
  return (
    <group position={[t.x, 0, t.z]}>
      <mesh geometry={body} material={M[t.mat]} position={[0, t.y0 + t.h / 2, 0]} />
      <mesh geometry={roof} material={t.roof === 'dome' ? M.dome : M[t.roof]} position={[0, t.roof === 'dome' ? top : top + t.roofH / 2, 0]} />
      {t.mat !== 'silo' &&
        [0.5, 0.75].map((f) => (
          <mesh key={f} position={[0, t.y0 + t.h * f, t.r + 0.02]} material={M.window}>
            <planeGeometry args={[0.6, 1.4]} />
          </mesh>
        ))}
      {t.banner && (
        <mesh position={[0, top - 5, t.r + 0.08]} material={M.banner}>
          <planeGeometry args={[2.2, 4.4]} />
        </mesh>
      )}
    </group>
  )
}

// plank deck following the bridge's arch, posts + rails along both sides
function Bridge({ b }) {
  const { planks, posts, rails, piles } = useMemo(() => {
    const n = Math.max(6, Math.ceil(b.len / 1.2))
    const planks = []
    const posts = []
    const rails = []
    const piles = []
    for (let i = 0; i < n; i++) {
      const s0 = (i / n) * b.len
      const s1 = ((i + 1) / n) * b.len
      const y0 = b.yAt(s0 / b.len)
      const y1 = b.yAt(s1 / b.len)
      const pitch = Math.atan2(y1 - y0, s1 - s0)
      planks.push({ p: [(s0 + s1) / 2, (y0 + y1) / 2, 0], s: [Math.hypot(s1 - s0, y1 - y0) + 0.04, 0.3, b.w], r: [0, 0, pitch] })
      if (s1 / b.len <= b.railEnd + 1e-6) {
        for (const side of [-1, 1]) rails.push({ p: [(s0 + s1) / 2, (y0 + y1) / 2 + 1.05, (side * b.w) / 2], s: [s1 - s0 + 0.05, 0.12, 0.12], r: [0, 0, pitch] })
      }
    }
    for (let s = 0; s <= b.len * b.railEnd + 0.01; s += b.len / Math.ceil(b.len / 2.5)) {
      const y = b.yAt(s / b.len)
      for (const side of [-1, 1]) posts.push({ p: [s, y + 0.5, (side * b.w) / 2], s: [0.18, 1.2, 0.18] })
    }
    if (b.kind !== 'draw') {
      for (let s = 4; s < b.len - 2; s += 5) {
        const y = b.yAt(s / b.len)
        for (const side of [-1, 1]) piles.push({ p: [s, y - 2.5, (side * (b.w - 0.4)) / 2], s: [0.35, 5, 0.35] })
      }
    }
    return { planks, posts, rails, piles }
  }, [b])
  const deck = b.kind === 'draw' ? M.darkWood : M.wood
  return (
    <group position={[b.A[0], 0, b.A[1]]} rotation={[0, -Math.atan2(b.u[1], b.u[0]), 0]}>
      <Instanced items={planks} geometry={BOX} material={deck} />
      <Instanced items={posts} geometry={BOX} material={M.darkWood} />
      <Instanced items={rails} geometry={BOX} material={M.wood} />
      <Instanced items={piles} geometry={BOX} material={M.darkWood} />
    </group>
  )
}

export function Sign({ s }) {
  const bw = 2.7
  const bh = 0.5 + s.lines.length * 0.42
  const tex = useMemo(() => T.signTex(s.lines, bw / bh), [s, bh])
  const y = heightAt(s.x, s.z)
  return (
    <group position={[s.x, y, s.z]} rotation={[0, s.rot, 0]}>
      <mesh material={M.darkWood} position={[0, (1.4 + bh) / 2 - 0.3, -0.08]}>
        <boxGeometry args={[0.18, 1.4 + bh + 0.6, 0.14]} />
      </mesh>
      <mesh material={M.wood} position={[0, 1.4 + bh / 2, 0]}>
        <boxGeometry args={[bw, bh, 0.1]} />
      </mesh>
      <mesh position={[0, 1.4 + bh / 2, 0.056]}>
        <planeGeometry args={[bw - 0.06, bh - 0.06]} />
        <meshLambertMaterial map={tex} />
      </mesh>
    </group>
  )
}

// log gateway with a name board on top (ranch entrance, canyon gate)
export function Gateway({ g, text, height = 5.2 }) {
  const y = heightAt(g.x, g.z)
  const tex = useMemo(() => T.signTex([text], 4.2), [text])
  const half = g.width / 2
  return (
    <group position={[g.x, y, g.z]} rotation={[0, g.rot, 0]}>
      {[-half, half].map((x) => (
        <mesh key={x} position={[x, height / 2 - 0.5, 0]} material={M.darkWood}>
          <cylinderGeometry args={[0.32, 0.38, height + 1, 8]} />
        </mesh>
      ))}
      <mesh position={[0, height, 0]} material={M.darkWood}>
        <boxGeometry args={[g.width + 1.4, 0.45, 0.45]} />
      </mesh>
      <mesh position={[0, height - 1.05, 0]} material={M.wood}>
        <boxGeometry args={[4.2, 1.0, 0.14]} />
      </mesh>
      {[0.075, -0.075].map((z) => (
        <mesh key={z} position={[0, height - 1.05, z]} rotation={[0, z > 0 ? 0 : Math.PI, 0]}>
          <planeGeometry args={[4.14, 0.94]} />
          <meshLambertMaterial map={tex} />
        </mesh>
      ))}
    </group>
  )
}

export default function Structures() {
  return (
    <>
      {BUILDINGS.map((b, i) => (
        <House key={i} b={b} />
      ))}
      {TOWERS.map((t, i) => (
        <Tower key={i} t={t} />
      ))}
      {BRIDGES.map((b, i) => (
        <Bridge key={i} b={b} />
      ))}
      {SIGNS.map((s, i) => (
        <Sign key={i} s={s} />
      ))}
      <Gateway g={CANYON_GATE} text="Gerudo Valley" height={6} />
    </>
  )
}
