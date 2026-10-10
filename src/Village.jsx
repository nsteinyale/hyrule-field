import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { VILLAGE } from './places.js'
import { WELL, WINDMILL } from './layout.js'
import { heightAt, rng } from './terrain.js'
import { cylGeo, roofGeo } from './geo.jsx'
import { M } from './materials.js'

const BOX = new THREE.BoxGeometry(1, 1, 1)

// tall plaster windmill; sails face the village square and turn slowly
function Windmill() {
  const sails = useRef()
  const y = heightAt(WINDMILL.x, WINDMILL.z)
  const body = useMemo(() => cylGeo(2.7, 4, 15, 12), [])
  const cap = useMemo(() => cylGeo(0.02, 3.4, 4.5, 12, 2), [])
  useFrame((_, dt) => (sails.current.rotation.z += dt * 0.6))
  return (
    <group position={[WINDMILL.x, y, WINDMILL.z]} rotation={[0, WINDMILL.rot, 0]}>
      <mesh geometry={body} material={M.plaster} position={[0, 6.5, 0]} />
      <mesh geometry={cap} material={M.roofBrown} position={[0, 16.2, 0]} />
      <mesh position={[0, 1.1, 3.8]} rotation={[-0.06, 0, 0]} material={M.door}>
        <planeGeometry args={[1.3, 2.2]} />
      </mesh>
      <mesh position={[0, 13, 2.85]} material={M.darkWood} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 1.2, 8]} />
      </mesh>
      <group ref={sails} position={[0, 13, 3.5]}>
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, 0, (k * Math.PI) / 2]}>
            <mesh material={M.darkWood} position={[0, 4, 0]} scale={[0.3, 8, 0.2]} geometry={BOX} />
            <mesh material={M.trim} position={[0.95, 4.6, 0.05]}>
              <planeGeometry args={[1.5, 6]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function Well() {
  const y = heightAt(WELL.x, WELL.z)
  const ring = useMemo(() => cylGeo(1.6, 1.7, 1, 14), [])
  const roof = useMemo(() => roofGeo(3, 2.6, 1.1, 0.3), [])
  return (
    <group position={[WELL.x, y, WELL.z]}>
      <mesh geometry={ring} material={M.stone} position={[0, 0.5, 0]} />
      <mesh position={[0, 0.9, 0]} rotation={[-Math.PI / 2, 0, 0]} material={M.window}>
        <circleGeometry args={[1.35, 14]} />
      </mesh>
      {[-1.45, 1.45].map((x) => (
        <mesh key={x} material={M.darkWood} position={[x, 1.6, 0]} scale={[0.15, 2.2, 0.15]} geometry={BOX} />
      ))}
      <mesh material={M.darkWood} position={[0, 2.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 2.9, 6]} />
      </mesh>
      <mesh material={M.wood} position={[0, 1.7, 0]}>
        <cylinderGeometry args={[0.22, 0.18, 0.35, 8]} />
      </mesh>
      <mesh geometry={roof} material={[M.roofRed, M.darkWood]} position={[0, 2.7, 0]} />
    </group>
  )
}

const hen = new THREE.MeshLambertMaterial({ color: '#fbf8f0', flatShading: true })
const red = new THREE.MeshLambertMaterial({ color: '#d8352a', flatShading: true })
const beak = new THREE.MeshLambertMaterial({ color: '#f0b030', flatShading: true })
const BODY = new THREE.IcosahedronGeometry(1, 1)

// little hens wandering the village square and pecking
function Chickens() {
  const birds = useMemo(() => {
    const r = rng(71)
    return Array.from({ length: 9 }, () => {
      const a = r() * Math.PI * 2
      const d = 4 + r() * 10
      const x = VILLAGE.c[0] + Math.sin(a) * d
      const z = VILLAGE.c[1] + Math.cos(a) * d
      return { x, z, tx: x, tz: z, wait: r() * 3, r }
    })
  }, [])
  const refs = useRef([])
  const heads = useRef([])
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    birds.forEach((b, i) => {
      const g = refs.current[i]
      if (!g) return
      const dx = b.tx - b.x
      const dz = b.tz - b.z
      const d = Math.hypot(dx, dz)
      let peck = false
      if (d > 0.1) {
        const step = Math.min(d, dt * 1.6)
        b.x += (dx / d) * step
        b.z += (dz / d) * step
        g.rotation.y = Math.atan2(dx, dz)
      } else if ((b.wait -= dt) <= 0) {
        // pick a new spot nearby, staying in the square and away from the well
        const a = b.r() * Math.PI * 2
        const nd = 4 + b.r() * 11
        b.tx = VILLAGE.c[0] + Math.sin(a) * nd
        b.tz = VILLAGE.c[1] + Math.cos(a) * nd
        b.wait = 1 + b.r() * 4
      } else peck = true
      g.position.set(b.x, heightAt(b.x, b.z) + (d > 0.1 ? Math.abs(Math.sin(t * 14 + i)) * 0.05 : 0), b.z)
      heads.current[i].rotation.x = peck && Math.sin(t * 9 + i) > 0 ? 0.9 : 0
    })
  })
  return birds.map((_, i) => (
    <group key={i} ref={(o) => (refs.current[i] = o)}>
      <mesh geometry={BODY} material={hen} position={[0, 0.32, 0]} scale={[0.2, 0.2, 0.27]} />
      <mesh material={hen} position={[0, 0.42, -0.25]} rotation={[-0.6, 0, 0]} scale={[0.14, 0.18, 0.08]} geometry={BOX} />
      <group ref={(o) => (heads.current[i] = o)} position={[0, 0.45, 0.18]}>
        <mesh geometry={BODY} material={hen} position={[0, 0.08, 0.06]} scale={0.1} />
        <mesh material={red} position={[0, 0.2, 0.06]} scale={[0.03, 0.07, 0.1]} geometry={BOX} />
        <mesh material={beak} position={[0, 0.07, 0.17]} scale={[0.05, 0.04, 0.07]} geometry={BOX} />
      </group>
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} material={beak} position={[x, 0.08, 0]} scale={[0.025, 0.18, 0.025]} geometry={BOX} />
      ))}
    </group>
  ))
}

function Crates() {
  const spots = [[112, -100, 0.3], [113.2, -100.6, 0.9], [137, -96, 0.1], [118, -116, 0.6]]
  return spots.map(([x, z, r], i) => (
    <mesh key={i} material={M.wood} position={[x, heightAt(x, z) + 0.45, z]} rotation={[0, r, 0]} scale={0.9} geometry={BOX} />
  ))
}

export default function Village() {
  return (
    <>
      <Windmill />
      <Well />
      <Chickens />
      <Crates />
    </>
  )
}
