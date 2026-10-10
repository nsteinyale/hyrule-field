import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RUPEES, floorAt } from './layout.js'
import { collect, got } from './rupeeStore.js'
import { chime } from './sound.js'

const PICK_R = 1.5
const COLORS = { green: '#2fdc4a', blue: '#3a7dff', red: '#ff3344' }

// six-sided gem: pointed top and bottom, straight sides
const GEM = (() => {
  const g = new THREE.LatheGeometry([new THREE.Vector2(0, -0.55), new THREE.Vector2(0.24, -0.28), new THREE.Vector2(0.24, 0.28), new THREE.Vector2(0, 0.55)], 6)
  g.computeVertexNormals()
  return g
})()

function Kind({ kind, list }) {
  const ref = useRef()
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLORS[kind], emissive: COLORS[kind], emissiveIntensity: 0.45, metalness: 0.3, roughness: 0.2, flatShading: true }),
    [kind],
  )
  const ys = useMemo(() => list.map((r) => floorAt(r.x, r.z) + 1.0), [list])
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) }), [])
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime
    const { m, q, p, s, up } = tmp
    const cx = camera.position.x
    const cz = camera.position.z
    list.forEach((r, i) => {
      const have = got.has(r.id)
      if (!have && Math.hypot(r.x - cx, r.z - cz) < PICK_R && Math.abs(camera.position.y - ys[i]) < 2.6) {
        collect(r)
        chime(r.kind)
      }
      p.set(r.x, ys[i] + Math.sin(t * 2 + r.id) * 0.12, r.z)
      q.setFromAxisAngle(up, t * 1.8 + r.id)
      const k = got.has(r.id) ? 0 : 1
      s.set(k, k, k)
      ref.current.setMatrixAt(i, m.compose(p, q, s))
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[GEM, mat, list.length]} frustumCulled={false} />
}

export default function Rupees() {
  const groups = useMemo(() => ['green', 'blue', 'red'].map((k) => [k, RUPEES.filter((r) => r.kind === k)]), [])
  return groups.map(([k, list]) => list.length > 0 && <Kind key={k} kind={k} list={list} />)
}
