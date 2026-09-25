// Empty + Active screens: suggestions (empty) → predictions (active). Search bar and keyboard live in App.
import { AnimatePresence, motion } from 'motion/react'
import { useSpring } from '../lib/tune'
import arrowDown from '../assets/arrow-down.svg'
import baggu from '../assets/baggu.png'
import star from '../assets/star.svg'
import search from '../assets/search.svg'

const SUGGESTIONS = ['Kitchen organizers that match my Caraway pot', 'White skate shoes', 'A gift for my nephew ']
const MERCHANTS = ['Allbirds', 'Steve Madden']
const QUERIES = ['shoes', 'shoes men', 'shoes women', 'shoes nike']
const STAGGER = 0.035

export function Compose({ mode }: { mode: 'empty' | 'active' }) {
  const enter = useSpring('compose.enter', { stiffness: 500, dampingRatio: 0.85 })
  const exit = useSpring('compose.exit', { stiffness: 700, dampingRatio: 1 })

  return (
    <AnimatePresence mode="popLayout">
      {mode === 'empty' ? (
        <motion.div
          key="suggestions"
          exit={{ opacity: 0, y: -8, filter: 'blur(4px)', transition: exit }}
          className="absolute left-0 top-[217px] flex w-full flex-col gap-3 px-5"
        >
          <p className="text-[14px] font-semibold leading-5 tracking-[-0.2px] text-black/55">Suggestions</p>
          {SUGGESTIONS.map((s) => (
            <div key={s} className="flex h-10 items-center gap-2 self-start rounded-full bg-black/[0.04] p-3">
              <img src={arrowDown} className="size-4" alt="" />
              <p className="text-[12px] font-medium leading-4 tracking-[-0.2px]">{s}</p>
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.div key="predictions" className="absolute left-5 top-[139px] flex w-[353px] flex-col gap-1">
          {[...MERCHANTS.map((m) => ({ m })), ...QUERIES.map((q) => ({ q }))].map((row, i, all) => (
            <motion.div
              key={i}
              // bottom-up stagger: rows nearest the search bar arrive first
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ ...enter, delay: (all.length - 1 - i) * STAGGER }}
              className="flex h-10 items-center gap-4 py-1"
            >
              {'m' in row ? (
                <>
                  <div className="size-8 overflow-hidden rounded-full border-[0.5px] border-[rgba(5,41,77,0.1)]">
                    <img src={baggu} className="size-full object-cover" alt="" />
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-[14px] leading-5 tracking-[-0.2px]">{row.m}</p>
                    <div className="flex items-center gap-0.5 rounded-md bg-black/[0.04] px-1 py-0.5 text-[12px] leading-[14px] text-black/55">
                      4.7 <img src={star} className="size-3" alt="" /> (163)
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex size-8 items-center justify-center">
                    <img src={search} className="size-5" alt="" />
                  </div>
                  <p className="text-[14px] leading-5 tracking-[-0.2px]">{row.q}</p>
                </>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
