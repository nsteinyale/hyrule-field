// Tiny synth chimes (no audio files). Browsers only allow sound after a click/tap, so App calls
// initAudio() from the "walk in" button.
let ctx = null

export function initAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (AC) ctx = new AC()
  }
  ctx?.resume?.()
}

function note(freq, at, dur, type = 'triangle', vol = 0.08) {
  if (!ctx) return
  const t0 = ctx.currentTime + at
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(vol, t0 + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(g).connect(ctx.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.05)
}

// a quick rising sparkle; bigger rupees get a longer run
export function chime(kind) {
  const runs = { green: [1047, 1568], blue: [1047, 1319, 1568, 2093], red: [784, 1047, 1319, 1568, 2093, 2637] }
  ;(runs[kind] || runs.green).forEach((f, i) => note(f, i * 0.06, 0.25))
}

export function fanfare() {
  const tune = [[523, 0], [659, 0.15], [784, 0.3], [1047, 0.45], [784, 0.75], [1047, 0.9]]
  tune.forEach(([f, t]) => {
    note(f, t, 0.5, 'square', 0.05)
    note(f / 2, t, 0.5, 'triangle', 0.06)
  })
}
