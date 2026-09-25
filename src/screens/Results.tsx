import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useSpring } from '../lib/tune'
import { BASE, linear } from '../lib/spring'
import { ProductCard, type Product } from './results/ProductCard'
import arrowRight from '../assets/results/icon-arrow-right.svg'
import thumbsUp from '../assets/results/icon-thumbs-up.svg'
import thumbsDown from '../assets/results/icon-thumbs-down.svg'
import repeat from '../assets/results/icon-repeat.svg'
import overflow from '../assets/results/icon-overflow.svg'
import product1 from '../assets/results/product-1.png'
import product2 from '../assets/results/product-2.png'
import product3 from '../assets/results/product-3.png'
import source1 from '../assets/results/source-1.png'
import source2 from '../assets/results/source-2.png'
import source3 from '../assets/results/source-3.png'

// ─── Direction knobs ────────────────────────────────────────────────
/** Seconds between each section (intro → header → shelf → follow-up → chips → meta). */
export const STAGGER = 0.05
/** Seconds between product cards (inside the shelf's slot). */
export const CARD_STAGGER = 0.05
/** Seconds between the two suggestion chips. */
export const CHIP_STAGGER = 0.1
/** Delay before the first piece starts. */
export const START_DELAY = 0
/** Sections rise this many px (Y only — no X on anything but the cards). */
export const RISE_Y = 25
/** Product cards slide in from this many px to the right. */
export const CARD_X = 64
/** Product cards scale in from this. */
export const CARD_SCALE = 0.92
/** Suggestion chips scale in from this (origin center, no Y). */
export const CHIP_SCALE = 0.6
/** Suggestion chips also slide in from the right by this. */
export const CHIP_X = 24
/** Opacity fades are a linear tween (seconds), decoupled from spring motion. */
export const FADE_DURATION = 0.2
/** Springs (stiffness + dampingRatio); live-tunable with ?tune. */
export const SPRINGS = {
  block: BASE, // results.block — intro, header, follow-up text (Y)
  card: { stiffness: 150, dampingRatio: 0.65 }, // results.card — card X + scale
  chip: { stiffness: 200, dampingRatio: 0.7 }, // results.chip — chip scale
}

// Timeline (seconds from START_DELAY). Meta row fades in last, no movement.
const T = {
  text: 0,
  header: STAGGER,
  shelf: 2 * STAGGER,
  followText: 3 * STAGGER,
  chips: 4 * STAGGER,
}
const T_META = T.chips + CHIP_STAGGER + STAGGER // after the last chip
// ────────────────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  { image: product1, merchant: 'Merchant Name', name: 'Product Name', price: '$50.00', reviews: 38 },
  { image: product2, merchant: 'Merchant Name', name: 'Product Name', price: '$50.00', reviews: 38 },
  { image: product3, merchant: 'Merchant Name', name: 'Product Name', price: '$50.00', reviews: 38 },
]
const SUGGESTIONS = ['Specific goal', 'First marathon']
const SOURCES = [source1, source2, source3]

function useEnter() {
  const block = useSpring('results.block', SPRINGS.block)
  const card = useSpring('results.card', SPRINGS.card)
  const chip = useSpring('results.chip', SPRINGS.chip)
  const fade = (t: number) => linear(FADE_DURATION, START_DELAY + t)
  const move = (s: typeof block, t: number) => ({ ...s, delay: START_DELAY + t })
  return {
    /** Sections: Y only. */
    rise: (t: number) => ({
      initial: { opacity: 0, y: RISE_Y },
      animate: { opacity: 1, y: 0 },
      transition: { y: move(block, t), opacity: fade(t) },
    }),
    /** Shoe cards: X from the right + scale on the card spring. */
    slide: (i: number) => {
      const t = T.shelf + i * CARD_STAGGER
      return {
        initial: { opacity: 0, x: CARD_X, y: RISE_Y, scale: CARD_SCALE },
        animate: { opacity: 1, x: 0, y: 0, scale: 1 },
        transition: { x: move(card, t), y: move(block, t), scale: move(card, t), opacity: fade(t) },
      }
    },
    /** Suggestion chips: scale only, origin center. */
    pop: (i: number) => {
      const t = T.chips + i * CHIP_STAGGER
      return {
        initial: { opacity: 0, x: CHIP_X, y: RISE_Y, scale: CHIP_SCALE },
        animate: { opacity: 1, x: 0, y: 0, scale: 1 },
        transition: { x: move(card, t), y: move(block, t), scale: move(chip, t), opacity: fade(t) },
        style: { originX: 0.5, originY: 0.5 },
      }
    },
    /** Meta row: opacity only. */
    fadeIn: (t: number) => ({
      initial: { opacity: 0, y: RISE_Y },
      animate: { opacity: 1, y: 0 },
      transition: { y: move(block, t), opacity: fade(t) },
    }),
  }
}

const body = 'text-[16px] leading-[22px] tracking-[-0.5px] text-black'

function Chip({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-[4px] rounded-full bg-black/[0.04] py-[4px] pl-[4px] pr-[8px]">
      {children}
    </div>
  )
}

export function Results() {
  const enter = useEnter()

  return (
    <div
      className="flex w-[402px] flex-col gap-[16px] px-[20px] pb-[24px]"
      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
    >
      {/* Intro text block */}
      <motion.p {...enter.rise(T.text)} className={`p-[4px] ${body}`}>
        For marathon training, the key decision is choosing between{' '}
        <span className="font-semibold">carbon-plated super shoes</span> (for race day and speed work) and{' '}
        <span className="font-semibold">daily trainers</span> (for long runs and easy miles).
      </motion.p>

      {/* Category: header + shelf */}
      <div className="flex flex-col gap-[12px]">
        <motion.div {...enter.rise(T.header)} className="flex items-start gap-[4px] px-[4px]">
          <div className="flex min-w-0 flex-1 flex-col gap-px text-black">
            <h2 className="text-[18px] font-semibold leading-[20px] tracking-[-0.5px]">Carbon-plated super shoes</h2>
            <p className="text-[14px] leading-[20px] tracking-[-0.2px]">
              Enhance your speed with carbon-plated super shoes—ideal for your upcoming marathons and speed sessions.
            </p>
          </div>
          <button
            type="button"
            aria-label="See all"
            className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-black/[0.04] backdrop-blur-[2px]"
          >
            <img src={arrowRight} alt="" className="block size-[16px]" />
          </button>
        </motion.div>

        {/* Shelf bleeds to the screen edges; cards keep the 20px margin at rest */}
        <div className="-mx-[20px] flex gap-[16px] overflow-x-auto px-[20px] pb-[12px] -mb-[12px] [scrollbar-width:none]">
          {PRODUCTS.map((p, i) => (
            <motion.div key={i} {...enter.slide(i)} className="shrink-0">
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Follow-up */}
      <div className="flex flex-col gap-[8px]">
        <motion.p {...enter.rise(T.followText)} className={`p-[4px] ${body}`}>
          Are you training for a specific marathon goal (time target), or is this your first marathon where comfort
          is the priority?
        </motion.p>
        <div className="flex gap-[8px]">
          {SUGGESTIONS.map((label, i) => (
            <motion.button
              key={label}
              type="button"
              {...enter.pop(i)}
              className="rounded-full border-[0.5px] border-[rgba(24,59,78,0.06)] bg-white px-[12px] py-[8px] text-[12px] font-semibold leading-[16px] tracking-[-0.2px] text-black shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-1px_30px_#f2f4f5]"
            >
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Meta row */}
      <motion.div {...enter.fadeIn(T_META)} className="flex h-[21px] items-center gap-[12px] px-[4px]">
        {[thumbsUp, thumbsDown, repeat, overflow].map((src) => (
          <img key={src} src={src} alt="" className="block size-[16px]" />
        ))}
        <Chip>
          <div className="flex items-center">
            {SOURCES.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                className={`size-[12px] rounded-full border border-[rgba(5,41,77,0.1)] bg-white object-cover ${i < 2 ? '-mr-[6px]' : ''}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-semibold leading-[13px] tracking-[-0.2px] text-black/75">Sources</span>
        </Chip>
      </motion.div>
    </div>
  )
}
