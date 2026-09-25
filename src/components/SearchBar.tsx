// The one persistent search bar. It never unmounts. It's animated explicitly (not via `layout`) so
// that vertical and horizontal can use different springs: Y moves first, and the width collapse lags
// behind on a slower, bouncier spring.
import { AnimatePresence, motion } from 'motion/react'
import { useSpring } from '../lib/tune'
import { BASE, linear } from '../lib/spring'
import cursor from '../assets/cursor.svg'
import plus from '../assets/plus.svg'
import arrowRight from '../assets/arrow-right.svg'
import chevronLeft from '../assets/chevron-left.svg'
import searchNav from '../assets/search-nav.svg'

export const QUERY = 'Shoes for marathon training'

// No backdrop blur: it forced a full repaint every frame while the bar resizes, which dropped frames
const GLASS = 'bg-white/90 border-[0.5px] border-white/75'

// Geometry (phone is 402 × 874). The bar is anchored by its BOTTOM edge, so it drops as a whole card
// first, then collapses in height and width once it's near the bottom of the screen.
const BOTTOM = 874 - (418 + 102) // compose card's bottom inset
export const Y_SPRING = { stiffness: 150, dampingRatio: 0.85 } // less overshoot on the drop so the sideways bounce reads
export const DROP = BOTTOM - 24 // y travel, down to the docked bottom inset (24)
const COMPOSE = { y: 0, height: 102, left: 12, width: 378 }
const DOCKED = { y: DROP, height: 56, left: 80, width: 402 - 80 - 16 }
// Shadows share one structure so they interpolate smoothly; depth changes with the shape
const SHADOW_COMPOSE = '0px 0px 24px 2px rgba(0,0,0,0.12)'
const SHADOW_DOCKED = '0px 8px 40px 0px rgba(0,0,0,0.24)'
const SHADOW_NONE = '0px 8px 40px 0px rgba(0,0,0,0)'
const SHADOW_T = { type: 'tween' as const, ease: 'easeInOut' as const, duration: 0.45 }
const BACK_START_X = 64 // the back button starts tucked behind the bar's left edge
export const SHAPE_DELAY = 0.22 // s: width collapse (bouncy X) starts here
const HEIGHT_DELAY = 0.08 // s: height collapses early, with the drop
const CONTENT_FADE = { duration: 0.12, delay: 0.04 } // compose content is gone before the bar lands

type Mode = 'empty' | 'active' | 'docked'

function Cursor({ typing }: { typing: boolean }) {
  return <img src={cursor} className={`h-[22px] w-px ${typing ? '' : 'cursor-blink'}`} alt="" />
}

export function SearchBar({
  mode, typed, typing, onSend, onBack,
}: { mode: Mode; typed: string; typing: boolean; onSend: () => void; onBack: () => void }) {
  const Y = useSpring('searchbar.y', Y_SPRING)
  const X = useSpring('searchbar.x', { stiffness: 90, dampingRatio: 0.5 })
  const base = useSpring('searchbar.base', BASE)
  const docked = mode === 'docked'
  const ready = typed === QUERY && !typing

  return (
    <>
      {/* Back button: rides down with the bar (Y), then shoots out from behind it (X).
          initial={false}: when the flow is jumped straight to a docked stage it's just in place. */}
      <AnimatePresence initial={false}>
        {docked && (
          <motion.button
            key="back"
            onClick={onBack}
            initial={{ x: BACK_START_X, opacity: 0, boxShadow: SHADOW_NONE }}
            animate={{ x: 0, opacity: 1, boxShadow: SHADOW_DOCKED }}
            exit={{ opacity: 0 }}
            transition={{
              x: { ...X, delay: SHAPE_DELAY },
              opacity: linear(0.15, SHAPE_DELAY + 0.05),
              boxShadow: { ...SHADOW_T, delay: SHAPE_DELAY },
            }}
            className={`absolute bottom-6 left-4 z-10 flex size-14 items-center justify-center rounded-full ${GLASS}`}
          >
            <img src={chevronLeft} className="size-5" alt="" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          ...(docked ? DOCKED : COMPOSE),
          boxShadow: docked ? SHADOW_DOCKED : SHADOW_COMPOSE,
        }}
        transition={{
          y: Y,
          height: { ...Y, delay: docked ? HEIGHT_DELAY : 0 },
          left: { ...X, delay: docked ? SHAPE_DELAY : 0 },
          width: { ...X, delay: docked ? SHAPE_DELAY : 0 },
          boxShadow: { ...SHADOW_T, delay: docked ? SHAPE_DELAY : 0 },
        }}
        style={{ bottom: BOTTOM, borderRadius: 28 }}
        className={`absolute z-20 overflow-hidden ${GLASS}`}
      >
        {/* Compose content: fixed width so the collapse clips it instead of reflowing it */}
        <motion.div
          initial={false}
          animate={{ opacity: docked ? 0 : 1 }}
          transition={{ opacity: docked ? linear(CONTENT_FADE.duration, CONTENT_FADE.delay) : linear(0.15) }}
          className="absolute bottom-0 left-0 flex w-[378px] flex-col gap-1 p-2"
        >
          <div className="flex h-[42px] items-center overflow-hidden p-[10px]">
            {!typed ? (
              <>
                <Cursor typing={false} />
                <p className="ml-[-1px] text-[16px] leading-[22px] tracking-[-0.5px] text-black/35">Search</p>
              </>
            ) : (
              <>
                <p className="whitespace-pre text-[16px] leading-[22px] tracking-[-0.5px] text-black">{typed}</p>
                {!docked && <span className="ml-[2px] flex"><Cursor typing={typing} /></span>}
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-full border-[0.5px] border-black/10">
              <img src={plus} className="size-6" alt="" />
            </div>
            <motion.button
              onClick={onSend}
              disabled={!ready || docked}
              initial={false}
              animate={{
                backgroundColor: typed ? '#5433eb' : 'rgba(0,0,0,0.1)',
                boxShadow: typed ? '0 4px 12px rgba(69,36,219,0.34)' : '0 4px 12px rgba(69,36,219,0)',
              }}
              whileTap={{ scale: 0.9 }}
              transition={base}
              className="flex size-10 items-center justify-center rounded-full"
            >
              <img src={arrowRight} className="size-5" alt="" />
            </motion.button>
          </div>
        </motion.div>

        {/* Docked content */}
        <motion.div
          initial={false}
          animate={{ opacity: docked ? 1 : 0 }}
          transition={{ opacity: linear(0.2, docked ? SHAPE_DELAY + 0.1 : 0) }}
          className="pointer-events-none absolute inset-y-0 left-0 flex w-[306px] items-center gap-1 px-2"
        >
          <div className="flex size-9 items-center justify-center">
            <img src={searchNav} className="size-6" alt="" />
          </div>
          <p className="text-[16px] leading-[22px] tracking-[-0.5px] text-black/55">Reply</p>
        </motion.div>
      </motion.div>
    </>
  )
}
