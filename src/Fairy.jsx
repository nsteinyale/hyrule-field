import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { M } from './materials.js'

// a little glowing fairy that keeps you company, floating just ahead and to the right
export default function Fairy() {
  const g = useRef()
  const wings = useRef([])
  const v = useMemo(() => ({ fwd: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), target: new THREE.Vector3() }), [])
  const glowMat = useMemo(() => M.glow.clone(), [])
  const wingMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#bfe4ff", transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }), [])
  useFrame(({ camera, clock }, dt) => {
    const t = clock.elapsedTime
    camera.getWorldDirection(v.fwd)
    v.right.crossVectors(v.fwd, v.up).normalize()
    v.target
      .copy(camera.position)
      .addScaledVector(v.fwd, 3)
      .addScaledVector(v.right, 1.1 + Math.sin(t * 0.7) * 0.25)
      .addScaledVector(v.up, -0.1 + Math.sin(t * 2.1) * 0.15)
    if (g.current.position.lengthSq() === 0) g.current.position.copy(v.target)
    g.current.position.lerp(v.target, 1 - Math.exp(-dt * 3.5))
    g.current.quaternion.copy(camera.quaternion)
    glowMat.opacity = 0.55 + Math.sin(t * 5) * 0.2
    const flap = Math.sin(t * 34) * 0.6
    if (wings.current[0]) wings.current[0].rotation.y = 0.5 + flap
    if (wings.current[1]) wings.current[1].rotation.y = -0.5 - flap
  })
  return (
    <group ref={g}>
      <sprite material={glowMat} scale={[0.32, 0.32, 1]} />
      <mesh>
        <sphereGeometry args={[0.055, 10, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {[-1, 1].map((s, i) => (
        <group key={s} ref={(o) => (wings.current[i] = o)} position={[s * 0.03, 0.03, 0]}>
          <mesh material={wingMat} position={[s * 0.07, 0.02, 0]} rotation={[0, 0, s * 0.4]}>
            <circleGeometry args={[0.065, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
