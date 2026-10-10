import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RANCH } from './places.js'
import { COWS, FENCE, HAY, RANCH_GATE } from './layout.js'
import { heightAt } from './terrain.js'
import { Instanced } from './geo.jsx'
import { M } from './materials.js'
import { Gateway } from './Structures.jsx'

const BOX = new THREE.BoxGeometry(1, 1, 1)
const HAYROLL = new THREE.CylinderGeometry(0.85, 0.85, 1.2, 12)

// read by the minimap
export const HORSE = { x: RANCH.track.c[0], z: RANCH.track.c[1] + RANCH.track.r }

function Fence() {
  const { posts, rails } = useMemo(() => {
    const posts = []
    const rails = []
    for (const [a, b] of FENCE) {
      const ya = heightAt(a[0], a[1])
      const yb = heightAt(b[0], b[1])
      posts.push({ p: [a[0], ya + 0.55, a[1]], s: [0.22, 1.5, 0.22] })
      posts.push({ p: [b[0], yb + 0.55, b[1]], s: [0.22, 1.5, 0.22] })
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const rot = -Math.atan2(b[1] - a[1], b[0] - a[0])
      for (const h of [0.55, 1.05]) rails.push({ p: [(a[0] + b[0]) / 2, (ya + yb) / 2 + h, (a[1] + b[1]) / 2], s: [len + 0.1, 0.13, 0.08], r: rot })
    }
    return { posts, rails }
  }, [])
  return (
    <>
      <Instanced items={posts} geometry={BOX} material={M.darkWood} />
      <Instanced items={rails} geometry={BOX} material={M.wood} />
    </>
  )
}

const brown = new THREE.MeshLambertMaterial({ color: '#8a5530', flatShading: true })
const white = new THREE.MeshLambertMaterial({ color: '#f2eee4', flatShading: true })
const black = new THREE.MeshLambertMaterial({ color: '#26221f', flatShading: true })
const pink = new THREE.MeshLambertMaterial({ color: '#e8a5a0', flatShading: true })

// a chestnut horse with a white mane, galloping laps of the track
function Horse() {
  const g = useRef()
  const body = useRef()
  const legs = useRef([])
  const neck = useRef()
  const theta = useRef(0)
  const { c, r } = RANCH.track
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    theta.current += (dt * 8.5) / r
    const th = theta.current
    const x = c[0] + r * Math.sin(th)
    const z = c[1] + r * Math.cos(th)
    HORSE.x = x
    HORSE.z = z
    g.current.position.set(x, heightAt(x, z), z)
    g.current.rotation.y = Math.atan2(Math.cos(th), -Math.sin(th))
    const gait = t * 11
    body.current.position.y = 1.4 + Math.abs(Math.sin(gait)) * 0.12
    neck.current.rotation.x = -0.65 + Math.sin(gait) * 0.08
    legs.current.forEach((l, i) => {
      if (l) l.rotation.x = Math.sin(gait + (i < 2 ? 0 : Math.PI) + (i % 2) * 0.6) * 0.75
    })
  })
  const legAt = [[-0.24, 0.72], [0.24, 0.72], [-0.24, -0.72], [0.24, -0.72]]
  return (
    <group ref={g}>
      <group ref={body}>
        <mesh material={brown} scale={[0.72, 0.78, 1.95]} geometry={BOX} />
        <group ref={neck} position={[0, 0.25, 0.85]}>
          <mesh material={brown} position={[0, 0.45, 0.1]} scale={[0.38, 0.95, 0.5]} geometry={BOX} />
          <mesh material={white} position={[0, 0.5, -0.12]} scale={[0.14, 1.0, 0.18]} geometry={BOX} />
          <mesh material={brown} position={[0, 0.88, 0.42]} rotation={[1.0, 0, 0]} scale={[0.34, 0.75, 0.38]} geometry={BOX} />
          <mesh material={white} position={[0, 0.78, 0.72]} rotation={[1.0, 0, 0]} scale={[0.12, 0.35, 0.39]} geometry={BOX} />
          {[-0.12, 0.12].map((ex) => (
            <mesh key={ex} material={brown} position={[ex, 1.12, 0.2]} scale={[0.08, 0.22, 0.08]} geometry={BOX} />
          ))}
        </group>
        <mesh material={white} position={[0, 0.05, -1.05]} rotation={[-0.7, 0, 0]} scale={[0.16, 0.9, 0.16]} geometry={BOX} />
        {legAt.map(([lx, lz], i) => (
          <group key={i} ref={(o) => (legs.current[i] = o)} position={[lx, -0.3, lz]}>
            <mesh material={brown} position={[0, -0.45, 0]} scale={[0.17, 0.9, 0.17]} geometry={BOX} />
            <mesh material={white} position={[0, -0.98, 0]} scale={[0.19, 0.2, 0.19]} geometry={BOX} />
          </group>
        ))}
      </group>
    </group>
  )
}

function Cow({ cow, phase }) {
  const head = useRef()
  const tail = useRef()
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase
    head.current.position.y = 1.05 - (Math.sin(t * 0.6) > 0.2 ? 0.45 : 0) // grazing
    tail.current.rotation.z = Math.sin(t * 3) * 0.4
  })
  const y = heightAt(cow.x, cow.z)
  return (
    <group position={[cow.x, y, cow.z]} rotation={[0, cow.rot, 0]}>
      <mesh material={white} position={[0, 1.05, 0]} scale={[0.9, 0.85, 1.7]} geometry={BOX} />
      <mesh material={black} position={[0.46, 1.15, 0.2]} scale={[0.02, 0.45, 0.6]} geometry={BOX} />
      <mesh material={black} position={[-0.46, 1.0, -0.35]} scale={[0.02, 0.4, 0.5]} geometry={BOX} />
      <mesh material={black} position={[0, 1.48, -0.3]} scale={[0.6, 0.02, 0.5]} geometry={BOX} />
      <group ref={head} position={[0, 1.05, 1.0]}>
        <mesh material={white} scale={[0.5, 0.5, 0.55]} geometry={BOX} />
        <mesh material={pink} position={[0, -0.12, 0.3]} scale={[0.42, 0.26, 0.12]} geometry={BOX} />
        {[-0.3, 0.3].map((hx) => (
          <mesh key={hx} material={white} position={[hx, 0.28, -0.05]} scale={[0.18, 0.08, 0.08]} geometry={BOX} />
        ))}
      </group>
      {[[-0.3, 0.6], [0.3, 0.6], [-0.3, -0.6], [0.3, -0.6]].map(([lx, lz]) => (
        <mesh key={`${lx}${lz}`} material={white} position={[lx, 0.32, lz]} scale={[0.2, 0.65, 0.2]} geometry={BOX} />
      ))}
      <group ref={tail} position={[0, 1.35, -0.86]}>
        <mesh material={black} position={[0, -0.4, 0]} scale={[0.07, 0.8, 0.07]} geometry={BOX} />
      </group>
    </group>
  )
}

export default function Ranch() {
  const hay = useMemo(() => HAY.map(([x, z], i) => ({ p: [x, heightAt(x, z) + 0.85, z], r: [Math.PI / 2, i * 0.9, 0] })), [])
  return (
    <>
      <Fence />
      <Gateway g={RANCH_GATE} text="Lon Lon Ranch" />
      <Instanced items={hay} geometry={HAYROLL} material={M.hay} />
      {COWS.map((cow, i) => (
        <Cow key={i} cow={cow} phase={i * 2.3} />
      ))}
      <Horse />
    </>
  )
}
