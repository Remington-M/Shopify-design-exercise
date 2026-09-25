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

const GLASS = 'bg-white/75 border-[0.5px] border-white/75 backdrop-blur-[10px]'

// Geometry (phone is 402 × 874)
const TOP = 418
const COMPOSE = { y: 0, height: 102, left: 12, width: 378 }
const DOCKED = { y: 794 - TOP, height: 56, left: 80, width: 402 - 80 - 16 }
const BACK_START_X = 64 // the back button starts tucked behind the bar's left edge

type Mode = 'empty' | 'active' | 'docked'

function Cursor({ typing }: { typing: boolean }) {
  return <img src={cursor} className={`h-[22px] w-px ${typing ? '' : 'cursor-blink'}`} alt="" />
}

export function SearchBar({
  mode, typed, typing, onSend, onBack,
}: { mode: Mode; typed: string; typing: boolean; onSend: () => void; onBack: () => void }) {
  const Y = useSpring('searchbar.y', { stiffness: 100, dampingRatio: 0.7 })
  const X = useSpring('searchbar.x', { stiffness: 60, dampingRatio: 0.5 })
  const base = useSpring('searchbar.base', BASE)
  const query = useSpring('searchbar.query', BASE)
  const docked = mode === 'docked'
  const ready = typed === QUERY && !typing

  return (
    <>
      {/* Back button: rides down with the bar (Y), then shoots out from behind it (X) */}
      <AnimatePresence>
        {docked && (
          <motion.button
            key="back"
            onClick={onBack}
            initial={{ x: BACK_START_X, y: -DOCKED.y, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ x: X, y: Y, opacity: linear(0.15) }}
            className={`absolute left-4 top-[794px] z-10 flex size-14 items-center justify-center rounded-full ${GLASS} shadow-[0_8px_40px_0_rgba(0,0,0,0.24)]`}
          >
            <img src={chevronLeft} className="size-5" alt="" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          ...(docked ? DOCKED : COMPOSE),
          boxShadow: docked
            ? '0 8px 40px 0 rgba(0,0,0,0.24)'
            : '0 0 24px 2px rgba(0,0,0,0.12)',
        }}
        transition={{ y: Y, height: Y, left: X, width: X, boxShadow: base }}
        style={{ top: TOP, borderRadius: 28 }}
        className={`absolute z-20 overflow-hidden ${GLASS}`}
      >
        {/* Compose content: fixed width so the collapse clips it instead of reflowing it */}
        <motion.div
          initial={false}
          animate={{ opacity: docked ? 0 : 1 }}
          transition={{ opacity: linear(0.15) }}
          className="absolute left-0 top-0 flex w-[378px] flex-col gap-1 p-2"
        >
          <div className="flex h-[42px] items-center overflow-hidden p-[10px]">
            {!typed ? (
              <>
                <Cursor typing={false} />
                <p className="ml-[-1px] text-[16px] leading-[22px] tracking-[-0.5px] text-black/35">Search</p>
              </>
            ) : (
              <>
                {!docked && (ready ? (
                  // Shared element: flies up to become the page title. Only becomes a layout
                  // element once typing is done, otherwise every keystroke would animate its width.
                  <motion.p
                    layoutId="query"
                    transition={query}
                    className="whitespace-pre text-[16px] leading-[22px] tracking-[-0.5px] text-black"
                  >
                    {typed}
                  </motion.p>
                ) : (
                  <p className="whitespace-pre text-[16px] leading-[22px] tracking-[-0.5px] text-black">{typed}</p>
                ))}
                {!docked && <Cursor typing={typing} />}
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
          transition={{ opacity: linear(0.2, docked ? 0.1 : 0) }}
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
