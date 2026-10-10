import * as THREE from 'three'
import * as T from './textures.js'

const lam = (o) => new THREE.MeshLambertMaterial(o)
const roof = (c) => lam({ map: T.roofTex(c), side: THREE.DoubleSide })

// shared materials; anything tinted per instance uses white as its base color
export const M = {
  stone: lam({ map: T.stoneTex('#c3b9a6') }),
  keep: lam({ map: T.stoneTex('#e6dfcf') }),
  plaster: lam({ map: T.plasterTex('#efe6d2') }),
  plasterWarm: lam({ map: T.plasterTex('#ead2a8') }),
  barn: lam({ map: T.plankTex('#a8322a') }),
  wood: lam({ map: T.plankTex('#8f5e34') }),
  darkWood: lam({ map: T.plankTex('#5c3b22') }),
  door: lam({ map: T.plankTex('#6b4226') }),
  silo: lam({ map: T.plankTex('#b9bcc2') }),
  roofRed: roof('#b8442f'),
  roofBrown: roof('#7b4b2a'),
  roofBlue: roof('#3b5ea8'),
  roofDark: roof('#4d4b55'),
  dome: lam({ color: '#9aa4ae' }),
  window: lam({ color: '#2b2622' }),
  trim: lam({ color: '#f3efe6' }),
  bark: lam({ color: '#6b4a2e', flatShading: true }),
  tint: lam({ color: '#ffffff', flatShading: true }), // leaves, rocks, mesas, flowers: color per instance
  hay: lam({ color: '#e2c262', flatShading: true }),
  iron: lam({ color: '#3a3a40' }),
  banner: lam({ map: T.bannerTex(), side: THREE.DoubleSide, transparent: true, alphaTest: 0.5 }),
  water: new THREE.MeshStandardMaterial({
    color: '#3c8fd2',
    map: T.waterTex(),
    transparent: true,
    opacity: 0.8,
    roughness: 0.15,
    metalness: 0.1,
  }),
  glow: new THREE.SpriteMaterial({ map: T.glowTex(), color: '#cfeaff', blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }),
}
export const awnings = {
  red: lam({ map: T.awningTex('#c0392b'), side: THREE.DoubleSide }),
  blue: lam({ map: T.awningTex('#2f6db5'), side: THREE.DoubleSide }),
  green: lam({ map: T.awningTex('#3c8f3a'), side: THREE.DoubleSide }),
  yellow: lam({ map: T.awningTex('#d9a520'), side: THREE.DoubleSide }),
}
