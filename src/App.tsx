import { useState } from 'react'
import { motion } from 'motion/react'
import { TunePanel, useSpring } from './lib/tune'

export default function App() {
  const [on, setOn] = useState(false)
  const slide = useSpring('slide', { stiffness: 400, dampingRatio: 0.6 })
  const pop = useSpring('pop', { stiffness: 800, dampingRatio: 0.5 })

  return (
    <main className="mx-auto max-w-[560px] p-8 font-sans">
      <h1 className="text-xl font-semibold">Spring test</h1>
      <p className="mb-4 text-sm opacity-70">Add ?tune to the URL for live sliders. Tap the track to toggle.</p>
      <div onClick={() => setOn(!on)} className="h-[120px] cursor-pointer rounded-2xl bg-neutral-100 p-4">
        <motion.div
          animate={{ x: on ? 380 : 0, scale: on ? 1.15 : 1 }}
          transition={{ default: slide, scale: pop }}
          className="size-[88px] rounded-[20px] bg-[#008060]"
        />
      </div>
      <TunePanel />
    </main>
  )
}
