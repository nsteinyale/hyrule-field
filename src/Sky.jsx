import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { MOUNTAIN } from './places.js'
import { rng } from './terrain.js'
import { Instanced } from './geo.jsx'
import { M } from './materials.js'

// sun sits high in the south-east, so the castle's south face is lit when you arrive
export const SUN_DIR = new THREE.Vector3(0.45, 0.7, 0.55).normalize()
const FOG = '#d4e9f5'

// big gradient dome that follows the camera
function Dome() {
  const ref = useRef()
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(1500, 32, 16)
    const top = new THREE.Color('#3f86d4')
    const mid = new THREE.Color('#86bcec')
    const hor = new THREE.Color(FOG)
    const col = []
    const p = g.attributes.position
    const c = new THREE.Color()
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 1500
      if (y < 0.08) c.copy(hor)
      else if (y < 0.35) c.copy(hor).lerp(mid, (y - 0.08) / 0.27)
      else c.copy(mid).lerp(top, Math.min(1, (y - 0.35) / 0.5))
      col.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    return g
  }, [])
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }), [])
  useFrame(({ camera }) => ref.current.position.copy(camera.position))
  return <mesh ref={ref} geometry={geo} material={mat} renderOrder={-1} />
}

function Sun() {
  const ref = useRef()
  const mat = useMemo(() => new THREE.SpriteMaterial({ map: M.glow.map, color: '#fff6d8', fog: false, depthWrite: false, transparent: true }), [])
  useFrame(({ camera }) => ref.current.position.copy(camera.position).addScaledVector(SUN_DIR, 1100))
  return <sprite ref={ref} material={mat} scale={[170, 170, 1]} renderOrder={-1} />
}

const PUFF = new THREE.IcosahedronGeometry(1, 1)
function Clouds() {
  const ref = useRef()
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.45, flatShading: true, fog: false }), [])
  const items = useMemo(() => {
    const r = rng(31)
    const out = []
    for (let k = 0; k < 26; k++) {
      const a = r() * Math.PI * 2
      const d = 380 + r() * 420
      const cx = Math.sin(a) * d
      const cz = Math.cos(a) * d
      const cy = 150 + r() * 110
      const n = 4 + Math.floor(r() * 4)
      for (let i = 0; i < n; i++) {
        const s = 14 + r() * 16
        out.push({ p: [cx + (i - n / 2) * 16 + r() * 8, cy + r() * 8, cz + (r() - 0.5) * 18], s: [s * 1.3, s * 0.6, s] })
      }
    }
    return out
  }, [])
  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.004))
  return (
    <group ref={ref}>
      <Instanced items={items} geometry={PUFF} material={mat} />
    </group>
  )
}

// the cloud ring that hangs over Death Mountain
function SmokeRing() {
  const ref = useRef()
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#efe9e0', emissive: '#ffffff', emissiveIntensity: 0.25, flatShading: true }), [])
  const items = useMemo(() => {
    const r = rng(41)
    return Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2
      const s = 9 + r() * 6
      return { p: [Math.sin(a) * 34, r() * 5, Math.cos(a) * 34], s: [s * 1.4, s * 0.7, s] }
    })
  }, [])
  useFrame((_, dt) => (ref.current.rotation.y += dt * 0.05))
  return (
    <group ref={ref} position={[MOUNTAIN.c[0], MOUNTAIN.h + 18, MOUNTAIN.c[1]]}>
      <Instanced items={items} geometry={PUFF} material={mat} />
    </group>
  )
}

export default function Sky() {
  const { scene } = useThree()
  useLayoutEffect(() => {
    scene.fog = new THREE.Fog(FOG, 150, 720)
    scene.background = new THREE.Color(FOG)
    return () => {
      scene.fog = null
    }
  }, [scene])
  const sunPos = useMemo(() => SUN_DIR.clone().multiplyScalar(300).toArray(), [])
  return (
    <>
      <Dome />
      <Sun />
      <hemisphereLight args={['#d6ebff', '#6f8f45', 1.25]} />
      <directionalLight position={sunPos} intensity={2.3} color="#fff1d6" />
      <ambientLight intensity={0.2} />
      <Clouds />
      <SmokeRing />
    </>
  )
}
