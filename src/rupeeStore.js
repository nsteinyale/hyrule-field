// Which rupees you've picked up. Saved in the browser so you can come back and keep hunting.
import { RUPEES } from './layout.js'

const KEY = 'hyrule-field-rupees'
export const VALUE = { green: 1, blue: 5, red: 20 }
export const TOTAL = RUPEES.length

const load = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'))
  } catch {
    return new Set()
  }
}
export const got = load()
const subs = new Set()
let last = null // most recent pickup, for the "+5" pop

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify([...got]))
  } catch {
    // private mode etc.; the hunt just won't persist
  }
  subs.forEach((f) => f())
}
export function collect(r) {
  if (got.has(r.id)) return
  got.add(r.id)
  last = { value: VALUE[r.kind], kind: r.kind, n: got.size }
  save()
}
export function resetRupees() {
  got.clear()
  last = null
  save()
}
export const subscribe = (f) => {
  subs.add(f)
  return () => subs.delete(f)
}
export const foundCount = () => got.size
export const lastPickup = () => last
export const wallet = () => RUPEES.reduce((s, r) => s + (got.has(r.id) ? VALUE[r.kind] : 0), 0)
