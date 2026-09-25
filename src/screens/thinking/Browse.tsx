// Browse variant of the "AI thinking" moment: shared spinner + status header, then an abstract
// grayscale shoe that cycles through running-shoe categories, as if the agent is browsing products.
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSpring } from '../../lib/tune'
import { linear, type Spring } from '../../lib/spring'
import { ThinkingHeader, useThinkingTimeline, text12 } from './_shared'
import product1 from '../../assets/results/product-1.png'
import product2 from '../../assets/results/product-2.png'
import product3 from '../../assets/results/product-3.png'

export type BrowseStage = 'thinking' | 'finishing' | 'results'

// ─── Cycle ───────────────────────────────────────────────────────────────────
const CYCLE_MS = 900 // time each shoe is on stage
const SHOE_OFFSET_X = 40 // enter from +X, exit to -X
const SHOE_SCALE_FROM = 0.9 // enter from / exit to this scale

// ─── Springs + fades ─────────────────────────────────────────────────────────
const SHOE_SPRING: Spring = { stiffness: 200, dampingRatio: 0.8 }
const SHOE_ENTER_FADE = linear(0.2)
const SHOE_EXIT_FADE = linear(0.15)
const CAPTION_ENTER_FADE = linear(0.15, 0.05)
const CAPTION_EXIT_FADE = linear(0.1)
const CARD_FADE = linear(0.15) // 'finishing': card fades out

// ─── Shoe treatment: desaturated + low contrast, white bg lifted to exactly the card gray (0.96),
// so the photo box disappears into the card and only a soft gray shoe remains.
const CARD_BG = '#f5f5f5' // 0.96
const SHOE_FILTER = 'grayscale(1) contrast(0.5) brightness(1.28)' // white → 0.75 → 0.96, black → 0.25 → 0.32

const SHOES = [
  { src: product1, caption: 'Carbon-plated racers', flip: false, scale: 1 },
  { src: product2, caption: 'Daily trainers', flip: true, scale: 0.94 },
  { src: product3, caption: 'Max-cushion', flip: false, scale: 1.04 },
  { src: product1, caption: 'Lightweight tempo', flip: true, scale: 0.9 },
  { src: product2, caption: 'Stability', flip: false, scale: 1 },
]


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
            initial={{ opacity: 0, x: SHOE_OFFSET_X, scale: SHOE_SCALE_FROM }}
            animate={{ opacity: 1, x: 0, scale: 1, transition: { ...shoeT, opacity: SHOE_ENTER_FADE } }}
            exit={{ opacity: 0, x: -SHOE_OFFSET_X, scale: SHOE_SCALE_FROM, transition: { ...shoeT, opacity: SHOE_EXIT_FADE } }}
          >
            <img
              src={shoe.src}
              alt=""
              draggable={false}
              className="block size-[190px] select-none object-contain"
              style={{
                filter: SHOE_FILTER,
                transform: `scale(${shoe.flip ? -shoe.scale : shoe.scale}, ${shoe.scale})`,
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Caption: quick linear crossfade */}
      <div className={`relative h-4 w-full text-center text-black/50 ${text12}`}>
        <AnimatePresence initial={false}>
          <motion.span
            key={shoe.caption + i}
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
