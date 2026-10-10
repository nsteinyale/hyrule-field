import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { COLORS, HEIGHTS, N, CELL, HALF, W1 } from './terrain.js'
import { WATER } from './places.js'
import { M } from './materials.js'

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))

// one big low-poly heightfield; flat shading gives the faceted, hand-built look
export function Ground() {
  const geo = useMemo(() => {
    const pos = new Float32Array(W1 * W1 * 3)
    const col = new Float32Array(W1 * W1 * 3)
    for (let j = 0; j <= N; j++) {
      for (let i = 0; i <= N; i++) {
        const k = j * W1 + i
        pos[k * 3] = -HALF + i * CELL
        pos[k * 3 + 1] = HEIGHTS[k]
        pos[k * 3 + 2] = -HALF + j * CELL
        col[k * 3] = toLinear(COLORS[k * 3])
        col[k * 3 + 1] = toLinear(COLORS[k * 3 + 1])
        col[k * 3 + 2] = toLinear(COLORS[k * 3 + 2])
      }
    }
    const idx = new Uint32Array(N * N * 6)
    let n = 0
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const a = j * W1 + i
        const b = (j + 1) * W1 + i
        const c = j * W1 + i + 1
        const d = (j + 1) * W1 + i + 1
        idx[n++] = a
        idx[n++] = b
        idx[n++] = c
        idx[n++] = c
        idx[n++] = b
        idx[n++] = d
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.setIndex(new THREE.BufferAttribute(idx, 1))
    g.computeVertexNormals()
    g.computeBoundingSphere()
    return g
  }, [])
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), [])
  return <mesh geometry={geo} material={mat} />
}

// one sheet of water at WATER height; the ground hides it except in the lake, river and moat
export function Water() {
  useFrame((_, dt) => {
    const m = M.water.map
    m.offset.x += dt * 0.004
    m.offset.y += dt * 0.0025
  })
  return (
    <mesh material={M.water} rotation={[-Math.PI / 2, 0, 0]} position={[0, WATER, 0]} renderOrder={1}>
      <planeGeometry args={[HALF * 2, HALF * 2]} />
    </mesh>
  )
}
