// The one persistent search bar. It never unmounts. `layout` morphs it between
// the compose card (empty/active) and the docked "Reply" pill (thinking → results).
import { AnimatePresence, motion } from 'motion/react'
import { useSpring } from '../lib/tune'
import cursor from '../assets/cursor.svg'
import plus from '../assets/plus.svg'
import arrowRight from '../assets/arrow-right.svg'
import chevronLeft from '../assets/chevron-left.svg'
import searchNav from '../assets/search-nav.svg'

export const QUERY = 'Shoes for marathon training'

const GLASS = 'bg-white/75 border-[0.5px] border-white/75 backdrop-blur-[10px]'

type Mode = 'empty' | 'active' | 'docked'

export function SearchBar({ mode, onSend, onBack }: { mode: Mode; onSend: () => void; onBack: () => void }) {
  const morph = useSpring('searchbar.morph', { stiffness: 380, dampingRatio: 0.86 })
  const content = useSpring('searchbar.content', { stiffness: 600, dampingRatio: 1 })
  const words = useSpring('searchbar.words', { stiffness: 500, dampingRatio: 0.9 })
  const docked = mode === 'docked'

  return (
    <>
      {/* Back button — only when docked */}
      <AnimatePresence>
        {docked && (
          <motion.button
            key="back"
            onClick={onBack}
            initial={{ opacity: 0, scale: 0.6, x: 24 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.6, x: 24 }}
            transition={morph}
            className={`absolute bottom-6 left-4 z-20 flex size-14 items-center justify-center rounded-full ${GLASS} shadow-[0_8px_40px_0_rgba(0,0,0,0.24)]`}
          >
            <img src={chevronLeft} className="size-5" alt="" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        layout
        transition={{ layout: morph }}
        style={{ borderRadius: docked ? 999 : 28 }}
        className={`absolute z-20 overflow-hidden ${GLASS} ${
          docked
            ? 'bottom-6 left-[80px] right-4 h-14 shadow-[0_8px_40px_0_rgba(0,0,0,0.24)]'
            : 'left-3 right-3 top-[418px] shadow-[0_1px_2px_-1px_rgba(0,0,0,0.12),0_0_24px_2px_rgba(0,0,0,0.12)]'
        }`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {docked ? (
            <motion.div
              key="reply"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={content}
              className="flex h-14 items-center gap-1 px-2"
            >
              <div className="flex size-9 items-center justify-center">
                <img src={searchNav} className="size-6" alt="" />
              </div>
              <p className="text-[16px] leading-[22px] tracking-[-0.5px] text-black/55">Reply</p>
            </motion.div>
          ) : (
            <motion.div
              key="compose"
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={content}
              className="flex flex-col gap-1 p-2"
            >
              <div className="flex h-[42px] items-center overflow-hidden p-[10px]">
                {mode === 'empty' ? (
                  <>
                    <img src={cursor} className="mr-[-1px] h-[22px] w-px animate-pulse" alt="" />
                    <p className="text-[16px] leading-[22px] tracking-[-0.5px] text-black/35">Search</p>
                  </>
                ) : (
                  <>
                    {/* Shared element: flies up to become the page title */}
                    <motion.p
                      layoutId="query"
                      transition={morph}
                      className="whitespace-nowrap text-[16px] leading-[22px] tracking-[-0.5px] text-black"
                    >
                      {QUERY.split(' ').map((w, i) => (
                        <motion.span
                          key={i}
                          className="inline-block whitespace-pre"
                          initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                          transition={{ ...words, delay: i * 0.05 }}
                        >
                          {w + (i < QUERY.split(' ').length - 1 ? ' ' : '')}
                        </motion.span>
                      ))}
                    </motion.p>
                    <img src={cursor} className="h-[22px] w-px animate-pulse" alt="" />
                  </>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-full border-[0.5px] border-black/10">
                  <img src={plus} className="size-6" alt="" />
                </div>
                <motion.button
                  onClick={onSend}
                  disabled={mode !== 'active'}
                  animate={{
                    backgroundColor: mode === 'active' ? '#5433eb' : 'rgba(0,0,0,0.1)',
                    boxShadow: mode === 'active' ? '0 4px 12px rgba(69,36,219,0.34)' : '0 4px 12px rgba(69,36,219,0)',
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={content}
                  className="flex size-10 items-center justify-center rounded-full"
                >
                  <img src={arrowRight} className="size-5" alt="" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
