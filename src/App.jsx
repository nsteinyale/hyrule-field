import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Canvas } from '@react-three/fiber'
import World from './World.jsx'
import Player from './Player.jsx'
import Minimap from './Minimap.jsx'
import TouchControls from './TouchControls.jsx'
import { EYE, SPAWN } from './layout.js'
import { TOTAL, foundCount, lastPickup, resetRupees, subscribe, wallet } from './rupeeStore.js'
import { fanfare, initAudio } from './sound.js'

export default function App() {
  const [locked, setLocked] = useState(false)
  const [where, setWhere] = useState('')
  const [showMap, setShowMap] = useState(true)
  const lockRef = useRef()
  const mapRef = useRef()
  const onLock = useCallback((v) => setLocked(v), [])
  const onWhere = useCallback((w) => setWhere(w), [])
  // phones have no pointer lock, so they get a joystick + drag-to-look instead
  const [isTouch] = useState(() => matchMedia('(pointer: coarse)').matches) // phones + tablets; touchscreen laptops still get mouse mode
  const [touchOn, setTouchOn] = useState(false)
  const touchRef = useRef({ active: false, move: [0, 0], look: [0, 0], jump: false })
  const setTouch = (on) => {
    touchRef.current.active = on
    touchRef.current.move = [0, 0]
    setTouchOn(on)
  }
  const playing = locked || touchOn
  useEffect(() => {
    const k = (e) => e.code === 'KeyM' && setShowMap((v) => !v)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  // rupee hunt
  const found = useSyncExternalStore(subscribe, foundCount)
  const pop = lastPickup()
  const [cheer, setCheer] = useState(false)
  const prevFound = useRef(found)
  useEffect(() => {
    const before = prevFound.current
    prevFound.current = found
    if (found === TOTAL && before < TOTAL) {
      setCheer(true)
      fanfare()
      const t = setTimeout(() => setCheer(false), 8000)
      return () => clearTimeout(t)
    }
  }, [found])

  const start = (touch) => {
    initAudio()
    if (touch) setTouch(true)
    else lockRef.current?.()
  }

  return (
    <>
      <Canvas camera={{ fov: 72, near: 0.1, far: 2200, position: [SPAWN.x, EYE, SPAWN.z] }} dpr={[1, 1.75]}>
        <World />
        <Player lockRef={lockRef} mapRef={mapRef} touchRef={touchRef} onLock={onLock} onWhere={onWhere} />
      </Canvas>

      <div className="where">
        <span className="dot" />
        {where}
      </div>
      <div className="wallet" title="Rupees found">
        <span className="gem" />
        <b>{wallet()}</b>
        <span className="count">
          {found}/{TOTAL}
        </span>
        {pop && (
          <span key={pop.n} className={`pop ${pop.kind}`}>
            +{pop.value}
          </span>
        )}
      </div>
      <div className={showMap ? 'mapwrap' : 'mapwrap hidden'}>
        <Minimap drawRef={mapRef} />
      </div>
      <button className="maptoggle" onClick={() => setShowMap((s) => !s)}>
        {showMap ? 'hide map' : 'map'}
      </button>
      {playing && <div className="crosshair" />}
      {touchOn && <TouchControls touchRef={touchRef} onPause={() => setTouch(false)} />}
      {cheer && (
        <div className="cheer">
          <div className="kicker">Amazing!</div>
          You found every rupee in Hyrule Field!
        </div>
      )}

      {!playing && (
        <div className="overlay" onClick={() => start(isTouch)}>
          <div className="card">
            <div className="kicker">A fan-made walk-through</div>
            <h1>Hyrule Field</h1>
            <p className="sub">
              Roam the big green field: the castle and its drawbridge, Lon Lon Ranch, Kakariko Village under Death Mountain, Lake Hylia, Kokiri Forest, and
              the Gerudo canyon. Your fairy will tag along. Find all {TOTAL} rupees (the map shows where)!
            </p>
            <button className="go">{isTouch ? 'Tap to start' : 'Click to start'}</button>
            {!isTouch && (
              <button
                className="go alt"
                onClick={(e) => {
                  e.stopPropagation()
                  start(true)
                }}
              >
                Use on-screen joystick
              </button>
            )}
            {isTouch ? (
              <div className="keys">
                <span><b>Left thumb</b> joystick to walk (push all the way to run)</span>
                <span><b>Right thumb</b> drag to look</span>
              </div>
            ) : (
              <div className="keys">
                <span><b>W A S D</b> walk</span>
                <span><b>Mouse</b> look</span>
                <span><b>Shift</b> run</span>
                <span><b>Space</b> jump</span>
                <span><b>C</b> crouch</span>
                <span><b>M</b> map</span>
                <span><b>Esc</b> pause</span>
              </div>
            )}
            {found > 0 && (
              <div className="progress">
                Rupees found: {found} / {TOTAL}
                <button
                  className="reset"
                  onClick={(e) => {
                    e.stopPropagation()
                    resetRupees()
                  }}
                >
                  start the hunt over
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
