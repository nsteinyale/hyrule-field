// Geometry helpers. UVs are in meters / TILE so textures keep the same scale on every size.
import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'

export const TILE = 4

export function boxGeo(w, h, d, tile = TILE) {
  const g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]] // px nx py ny pz nz
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile)
    }
  }
  return g
}

export function cylGeo(rt, rb, h, seg = 16, tile = TILE, open = false) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)
  const uv = g.attributes.uv
  const su = (2 * Math.PI * Math.max(rt, rb)) / tile
  const sv = Math.hypot(h, rb - rt) / tile
  for (let i = 0; i < (seg + 1) * 2; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv)
  return g
}

// gable roof sitting on y = 0, ridge along x. Group 0 = roof slopes, group 1 = gable ends (wall material)
export function roofGeo(w, d, rh, o = 0.5, tile = 2) {
  const W = w / 2 + o
  const D = d / 2 + o
  const slant = Math.hypot(D, rh)
  const pos = []
  const uv = []
  const quad = (a, b, c, e, ua, ub, uc, ue) => {
    pos.push(...a, ...b, ...c, ...a, ...c, ...e)
    uv.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ue)
  }
  const s = (2 * W) / tile
  const t = slant / tile
  quad([-W, 0, D], [W, 0, D], [W, rh, 0], [-W, rh, 0], [0, 0], [s, 0], [s, t], [0, t])
  quad([W, 0, -D], [-W, 0, -D], [-W, rh, 0], [W, rh, 0], [0, 0], [s, 0], [s, t], [0, t])
  const hw = w / 2
  const hd = d / 2
  pos.push(hw, 0, hd, hw, 0, -hd, hw, rh, 0)
  uv.push(0, 0, d / TILE, 0, d / 2 / TILE, rh / TILE)
  pos.push(-hw, 0, -hd, -hw, 0, hd, -hw, rh, 0)
  uv.push(0, 0, d / TILE, 0, d / 2 / TILE, rh / TILE)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  g.addGroup(0, 12, 0)
  g.addGroup(12, 6, 1)
  return g
}

// many copies of one mesh. items: { p: [x,y,z], r: yaw or [rx,ry,rz], s: [sx,sy,sz], c: '#hex' }
export function Instanced({ items, geometry, material }) {
  const ref = useRef()
  useLayoutEffect(() => {
    if (!ref.current) return // empty list renders nothing
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler(0, 0, 0, 'YXZ')
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    const c = new THREE.Color()
    items.forEach((it, i) => {
      p.set(...it.p)
      if (Array.isArray(it.r)) e.set(it.r[0], it.r[1], it.r[2])
      else e.set(0, it.r || 0, 0)
      q.setFromEuler(e)
      s.set(...(it.s || [1, 1, 1]))
      ref.current.setMatrixAt(i, m.compose(p, q, s))
      if (it.c) ref.current.setColorAt(i, c.set(it.c))
    })
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [items])
  if (!items.length) return null
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} frustumCulled={false} />
}

// a box stretched between two 3D points (chains, beams, rails)
export function Beam({ a, b, w = 0.1, material }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const A = new THREE.Vector3(...a)
    const B = new THREE.Vector3(...b)
    const dir = B.clone().sub(A)
    ref.current.position.copy(A).addScaledVector(dir, 0.5)
    ref.current.scale.set(w, dir.length(), w)
    ref.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  }, [a, b, w])
  return (
    <mesh ref={ref} material={material}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  )
}
