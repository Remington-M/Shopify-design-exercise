import { useState } from 'react'
import { motion } from 'motion/react'
import { spring, toCss, toDamping } from './lib/spring'

export default function App() {
  const [on, setOn] = useState(false)
  const [stiffness, setStiffness] = useState(400)
  const [dampingRatio, setDampingRatio] = useState(0.6)
  const s = { stiffness, dampingRatio }

  return (
    <main className="font-sans p-8 max-w-[560px] mx-auto">
      <h1 style={{ fontSize: 20 }}>Spring test</h1>
      <label style={{ display: 'block' }}>
        stiffness {stiffness}
        <input type="range" min={10} max={3000} value={stiffness} onChange={(e) => setStiffness(+e.target.value)} style={{ width: '100%' }} />
      </label>
      <label style={{ display: 'block' }}>
        dampingRatio {dampingRatio.toFixed(2)}
        <input type="range" min={0.05} max={1.5} step={0.01} value={dampingRatio} onChange={(e) => setDampingRatio(+e.target.value)} style={{ width: '100%' }} />
      </label>
      <p style={{ fontSize: 13, opacity: 0.7 }}>
        damping {toDamping(s).toFixed(2)} · settle ≈ {toCss(s).duration}ms
      </p>
      <div onClick={() => setOn(!on)} style={{ height: 120, background: '#eee', borderRadius: 16, padding: 16, cursor: 'pointer' }}>
        <motion.div
          animate={{ x: on ? 400 : 0 }}
          transition={spring(s)}
          style={{ width: 88, height: 88, borderRadius: 20, background: '#008060' }}
        />
      </div>
      <p style={{ fontSize: 13, opacity: 0.7 }}>Click the track to toggle.</p>
    </main>
  )
}
