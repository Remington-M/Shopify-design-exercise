// Browse variant of the "AI thinking" moment: shared spinner + status header, then a generic gray
// running-shoe silhouette that cycles through shoe categories, as if the agent is browsing products.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSpring } from '../../lib/tune'
import { linear, type Spring } from '../../lib/spring'
import { ThinkingHeader, useThinkingTimeline, text12 } from './_shared'
import sil1 from '../../assets/browse/sil-1.png'
import sil2 from '../../assets/browse/sil-2.png'
import sil3 from '../../assets/browse/sil-3.png'

export type BrowseStage = 'thinking' | 'finishing' | 'results'

// ─── Cycle ───────────────────────────────────────────────────────────────────
const CYCLE_MS = 900 // time each shoe is on stage
const SHOE_TRAVEL_X = 60 // enters from +X (right), exits to -X (left). No scale.

// ─── Springs + fades ─────────────────────────────────────────────────────────
const SHOE_SPRING: Spring = { stiffness: 300, dampingRatio: 0.6 } // snappy, slight bounce on x
const SHOE_ENTER_FADE = linear(0.18)
const SHOE_EXIT_FADE = linear(0.12)
const CAPTION_ENTER_FADE = linear(0.15, 0.05)
const CAPTION_EXIT_FADE = linear(0.1)
const CARD_FADE = linear(0.15) // 'finishing': card fades out

const CARD_BG = '#f5f5f5'
const SHOE_W = 220

// Silhouettes traced from real running-shoe photos (flat, so they read as generic)
type Shoe = { caption: string; src: string; w: number }
const SHOES: Shoe[] = [
  { caption: 'Carbon-plated racers', src: sil1, w: 1 },
  { caption: 'Max-cushion', src: sil2, w: 1 },
  { caption: 'Lightweight tempo', src: sil3, w: 1 },
  { caption: 'Daily trainers', src: sil1, w: 0.94 },
  { caption: 'Stability', src: sil2, w: 0.96 },
]
const SHOE_OPACITY = 0.12

export function Browse({ stage, onDone }: { stage: BrowseStage; onDone?: () => void }) {
  const labelIndex = useThinkingTimeline(stage, onDone)

  return (
    <div className="w-[402px] max-w-full text-black/75">
      <ThinkingHeader stage={stage} labelIndex={labelIndex} />

      {/* Shoe card: fades out on 'finishing', unmounted (no height) on 'results' */}
      {stage !== 'results' && (
        <motion.div
          initial={false}
          animate={{ opacity: stage === 'thinking' ? 1 : 0 }}
          transition={CARD_FADE}
          className="px-5 pt-4 pb-6"
        >
          <ShoeCycle running={stage === 'thinking'} />
        </motion.div>
      )}
    </div>
  )
}

function ShoeCycle({ running }: { running: boolean }) {
  const shoeT = useSpring('browse.shoe', SHOE_SPRING)
  const [i, setI] = useState(0)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setI((n) => n + 1), CYCLE_MS)
    return () => clearInterval(id)
  }, [running])

  const shoe = SHOES[i % SHOES.length]

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[200px] w-[362px] max-w-full overflow-hidden rounded-2xl" style={{ background: CARD_BG }}>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={i}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, x: SHOE_TRAVEL_X }}
            animate={{ opacity: 1, x: 0, transition: { x: shoeT, opacity: SHOE_ENTER_FADE } }}
            exit={{ opacity: 0, x: -SHOE_TRAVEL_X, transition: { x: shoeT, opacity: SHOE_EXIT_FADE } }}
          >
            <ShoeSvg shoe={shoe} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Caption: quick linear crossfade */}
      <div className={`relative h-4 w-full text-center text-black/50 ${text12}`}>
        <AnimatePresence initial={false}>
          <motion.span
            key={i}
            className="absolute inset-0 whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: CAPTION_ENTER_FADE }}
            exit={{ opacity: 0, transition: CAPTION_EXIT_FADE }}
          >
            {shoe.caption}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  )
}

function ShoeSvg({ shoe }: { shoe: Shoe }) {
  return (
    <img
      src={shoe.src}
      alt=""
      draggable={false}
      style={{ width: SHOE_W * 1.25 * shoe.w, opacity: SHOE_OPACITY }}
      className="block select-none"
    />
  )
}
