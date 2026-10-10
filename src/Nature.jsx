import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DEKU, LAKE, WATER } from './places.js'
import { COLORS, GRASSY, gridIndex, heightAt, rng, smooth } from './terrain.js'
import { MESAS, ROCKS, TREES } from './layout.js'
import { Instanced, cylGeo } from './geo.jsx'
import { M } from './materials.js'

const TAU = Math.PI * 2
const pick = (r, list) => list[Math.floor(r() * list.length)]

const TRUNK = new THREE.CylinderGeometry(0.22, 0.32, 1, 6).translate(0, 0.5, 0)
const CROWN = new THREE.IcosahedronGeometry(1, 0)
const CONE = new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0)
const ROCK = new THREE.DodecahedronGeometry(1, 0)
const MESA = new THREE.CylinderGeometry(1, 1, 1, 7).translate(0, 0.5, 0)
const BOX = new THREE.BoxGeometry(1, 1, 1)

function Trees() {
  const { trunks, crowns, cones } = useMemo(() => {
    const r = rng(17)
    const trunks = []
    const crowns = []
    const cones = []
    for (const t of TREES) {
      const y = heightAt(t.x, t.z) - 0.2
      const s = t.s
      if (t.kind === 'pine') {
        trunks.push({ p: [t.x, y, t.z], s: [0.8 * s, 3 * s, 0.8 * s] })
        const c = pick(r, ['#2d6b3a', '#245f37', '#367446', '#2f6a33'])
        for (let k = 0; k < 3; k++) {
          const w = (2.7 - k * 0.65) * s
          cones.push({ p: [t.x, y + 2.2 + (0.6 + k * 1.55) * s, t.z], s: [w, 2.7 * s, w], r: r() * TAU, c })
        }
      } else {
        trunks.push({ p: [t.x, y, t.z], s: [s, 2.2 + 2.2 * s, s] })
        const c = pick(r, ['#3f8a35', '#4f9a3a', '#347d2f', '#5aa743', '#468f37'])
        crowns.push({ p: [t.x, y + 2.3 + 2.2 * s, t.z], s: [2.4 * s, 2.1 * s, 2.4 * s], r: r() * TAU, c })
        const a = r() * TAU
        crowns.push({ p: [t.x + Math.sin(a) * 0.9 * s, y + 2.3 + 3.3 * s, t.z + Math.cos(a) * 0.9 * s], s: [1.5 * s, 1.4 * s, 1.5 * s], r: r() * TAU, c })
      }
    }
    return { trunks, crowns, cones }
  }, [])
  return (
    <>
      <Instanced items={trunks} geometry={TRUNK} material={M.bark} />
      <Instanced items={crowns} geometry={CROWN} material={M.tint} />
      <Instanced items={cones} geometry={CONE} material={M.tint} />
    </>
  )
}

function Rocks() {
  const items = useMemo(() => {
    const r = rng(23)
    return ROCKS.map((k) => ({
      p: [k.x, heightAt(k.x, k.z) + k.s * 0.25, k.z],
      s: [k.s * (1 + r() * 0.4), k.s * (0.6 + r() * 0.3), k.s],
      r: [r() * 0.4, k.rot, r() * 0.4],
      c: pick(r, ['#8d8a84', '#9b968c', '#7f7c78', '#a39d90']),
    }))
  }, [])
  return <Instanced items={items} geometry={ROCK} material={M.tint} />
}

// stacked red-rock mesas in the Gerudo canyon
function Mesas() {
  const items = useMemo(() => {
    const r = rng(29)
    const out = []
    for (const m of MESAS) {
      let y = heightAt(m.x, m.z) - 3
      const tiers = [[1, 0.5], [0.84, 0.32], [0.66, 0.18]]
      const rot = r() * TAU
      tiers.forEach(([rf, hf], i) => {
        const h = m.h * hf + (i === 0 ? 3 : 0)
        out.push({ p: [m.x, y, m.z], s: [m.r * rf, h, m.r * rf], r: rot + i * 0.4, c: ['#b85f37', '#c97a45', '#a9532f'][i] })
        y += h
      })
    }
    return out
  }, [])
  return <Instanced items={items} geometry={MESA} material={M.tint} />
}

// the giant old tree at the heart of the forest, with fairy lights drifting around it
function DekuTree() {
  const [x, z] = DEKU.c
  const y = heightAt(x, z) - 1
  const trunk = useMemo(() => cylGeo(3.4, DEKU.r + 1.2, 26, 12), [])
  const { roots, crowns } = useMemo(() => {
    const r = rng(37)
    const roots = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * TAU + r() * 0.3
      return { p: [x + Math.sin(a) * (DEKU.r + 1.5), y + 0.6, z + Math.cos(a) * (DEKU.r + 1.5)], s: [1.4, 1.2, 5], r: [0.35, a, 0] }
    })
    const crowns = []
    for (let i = 0; i < 11; i++) {
      const a = r() * TAU
      const d = i === 0 ? 0 : 6 + r() * 7
      const s = i === 0 ? 13 : 7 + r() * 4
      crowns.push({ p: [x + Math.sin(a) * d, y + 30 + r() * 6 - d * 0.35, z + Math.cos(a) * d], s: [s, s * 0.75, s], r: r() * TAU, c: pick(r, ['#2f6e2e', '#3a7d33', '#2a632b']) })
    }
    return { roots, crowns }
  }, [x, y, z])
  return (
    <>
      <mesh geometry={trunk} material={M.bark} position={[x, y + 13, z]} />
      <Instanced items={roots} geometry={BOX} material={M.bark} />
      <Instanced items={crowns} geometry={CROWN} material={M.tint} />
      <FairyLights cx={x} cy={y} cz={z} />
    </>
  )
}

function FairyLights({ cx, cy, cz }) {
  const refs = useRef([])
  const seeds = useMemo(() => {
    const r = rng(43)
    return Array.from({ length: 26 }, () => ({ a: r() * TAU, d: 5 + r() * 14, h: 1 + r() * 7, sp: 0.2 + r() * 0.5, ph: r() * TAU }))
  }, [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    seeds.forEach((s, i) => {
      const o = refs.current[i]
      if (!o) return
      const a = s.a + t * s.sp
      o.position.set(cx + Math.sin(a) * s.d, cy + s.h + Math.sin(t * 1.3 + s.ph) * 0.8, cz + Math.cos(a) * s.d)
      const k = 0.35 + 0.15 * Math.sin(t * 4 + s.ph)
      o.scale.set(k, k, 1)
    })
  })
  return seeds.map((_, i) => <sprite key={i} ref={(o) => (refs.current[i] = o)} material={M.glow} />)
}

// grass and flowers in a tile that wraps around the player, so it's always dense nearby
const BLADES = (() => {
  const pos = []
  const col = []
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI
    const c = Math.cos(a) * 0.09
    const s = Math.sin(a) * 0.09
    const lean = 0.08 * (k - 1)
    pos.push(-c, 0, -s, c, 0, s, lean, 0.62, lean * 0.5)
    col.push(0.62, 0.62, 0.62, 0.62, 0.62, 0.62, 1.2, 1.25, 1.1)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  g.computeVertexNormals()
  return g
})()
const FLOWER = new THREE.IcosahedronGeometry(0.08, 0).translate(0, 0.28, 0)

function windy(mat, timeRef) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = timeRef
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 ip = instanceMatrix[3];
        transformed.x += sin(uTime * 1.7 + ip.x * 0.15 + ip.z * 0.1) * 0.13 * position.y;
        transformed.z += cos(uTime * 1.3 + ip.x * 0.1) * 0.06 * position.y;`,
      )
  }
  return mat
}

function Scatter({ count, tile, geometry, material, seed, colorFn, scale }) {
  const ref = useRef()
  const last = useRef([1e9, 1e9])
  const data = useMemo(() => {
    const r = rng(seed)
    return Array.from({ length: count }, () => [r() * tile, r() * tile, r() * TAU, scale[0] + r() * (scale[1] - scale[0]), r()])
  }, [count, tile, seed, scale])
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), p: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color() }), [])
  useFrame(({ camera }) => {
    const cx = camera.position.x
    const cz = camera.position.z
    if (Math.hypot(cx - last.current[0], cz - last.current[1]) < 1.5) return
    last.current = [cx, cz]
    const half = tile / 2
    const { m, q, e, p, s, c } = tmp
    const mesh = ref.current
    data.forEach(([ox, oz, rot, sc, k], i) => {
      const x = cx - half + ((((ox - (cx - half)) % tile) + tile) % tile)
      const z = cz - half + ((((oz - (cz - half)) % tile) + tile) % tile)
      const gi = gridIndex(x, z)
      const fade = smooth(half, half * 0.6, Math.hypot(x - cx, z - cz))
      const on = GRASSY[gi] && fade > 0.05
      p.set(x, heightAt(x, z) - 0.03, z)
      q.setFromEuler(e.set(0, rot, 0))
      const f = on ? sc * fade : 0
      s.set(f, f, f)
      mesh.setMatrixAt(i, m.compose(p, q, s))
      colorFn(c, gi, k)
      mesh.setColorAt(i, c)
    })
    mesh.instanceMatrix.needsUpdate = true
    mesh.instanceColor.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[geometry, material, count]} frustumCulled={false} />
}

const FLOWER_COLORS = ['#ffffff', '#ffe066', '#ff7aa8', '#b58cff', '#ff5a4e', '#ffffff'].map((h) => new THREE.Color(h))
function Ground() {
  const time = useMemo(() => ({ value: 0 }), [])
  const grassMat = useMemo(() => windy(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), time), [time])
  const flowerMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), [])
  useFrame(({ clock }) => (time.value = clock.elapsedTime))
  const grassColor = (c, gi) => c.setRGB(COLORS[gi * 3] * 1.05, COLORS[gi * 3 + 1] * 1.08, COLORS[gi * 3 + 2], THREE.SRGBColorSpace)
  const flowerColor = (c, gi, k) => c.copy(FLOWER_COLORS[Math.floor(k * FLOWER_COLORS.length)])
  return (
    <>
      <Scatter count={7000} tile={90} geometry={BLADES} material={grassMat} seed={51} colorFn={grassColor} scale={[0.55, 1.1]} />
      <Scatter count={650} tile={90} geometry={FLOWER} material={flowerMat} seed={53} colorFn={flowerColor} scale={[0.8, 1.3]} />
    </>
  )
}

function LilyPads() {
  const items = useMemo(() => {
    const r = rng(61)
    const out = []
    for (let k = 0; k < 400 && out.length < 45; k++) {
      const a = r() * TAU
      const d = LAKE.r - 14 + r() * 14
      const x = LAKE.c[0] + Math.sin(a) * d
      const z = LAKE.c[1] + Math.cos(a) * d
      const h = heightAt(x, z)
      if (h > WATER - 0.4 || h < WATER - 2.5) continue
      if (Math.abs(x - LAKE.c[0]) < 4) continue // keep the bridge clear
      const s = 0.45 + r() * 0.5
      out.push({ p: [x, WATER + 0.03, z], s: [s, 1, s], r: r() * TAU, c: pick(r, ['#4c9a3c', '#5aa847', '#3f8a35']) })
    }
    return out
  }, [])
  const geo = useMemo(() => new THREE.CylinderGeometry(1, 1, 0.04, 10, 1, false, 0.3, TAU - 0.6), [])
  return <Instanced items={items} geometry={geo} material={M.tint} />
}

export default function Nature() {
  return (
    <>
      <Trees />
      <Rocks />
      <Mesas />
      <DekuTree />
      <Ground />
      <LilyPads />
    </>
  )
}
