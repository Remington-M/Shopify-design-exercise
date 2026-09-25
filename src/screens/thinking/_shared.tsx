// Shared "AI thinking" header: timeline + spinner/status label row (used by Shimmer, Browse).
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Spinner } from '../../components/Spinner'
import { useSpring } from '../../lib/tune'
import { BASE, linear } from '../../lib/spring'
import chevronIcon from '../../assets/steps/chevron-down.svg'

export type ThinkingStage = 'thinking' | 'finishing' | 'results'

// ─── Timeline (ms from mount of the 'thinking' stage), matches Steps ─────────
export const THINKING_T = {
  searching: 1000, // label → "Searching the web..."
  reading: 3400, // label → "Reading 16 sources..."
  done: 6400, // onDone()
}

/** Indexed by labelIndex: 0 Thinking, 1 Searching, 2 Reading. */
export const LABELS = ['Thinking...', 'Searching the web...', 'Reading 16 sources...'] as const
export const DONE_LABEL = 'Done'

// ─── Springs + fades ─────────────────────────────────────────────────────────
const SPRINGS = { word: BASE, chevron: BASE }
const LABEL_EXIT_Y = -3 // old label: slight upward drift while fading
const LABEL_EXIT = linear(0.12) // old label fades out fully BEFORE the new one starts (mode="wait")
const WORD_RISE_Y = 6 // new label: each word rises from +6px
const WORD_FADE_S = 0.18
const WORD_STAGGER_S = 0.04
const DONE_EXIT = linear(0.15) // "Done" row just fades (no movement)…
const TOGGLE_ENTER = linear(0.2) // …then "Assistant steps ›" fades in (no movement)

export const text12 = 'text-[12px] leading-[16px] tracking-[-0.2px]'

/** Dismiss timing when leaving 'thinking': the below-header content fades out, then unmounts (height → 0). */
export const DISMISS_MS = 150

/**
 * True once the below-header content should be gone: DISMISS_MS after entering 'finishing',
 * or immediately if mounted directly in 'finishing' / 'results' (stage jump).
 */
export function useDismissed(stage: ThinkingStage, ms = DISMISS_MS): boolean {
  const [gone, setGone] = useState(stage !== 'thinking')
  useEffect(() => {
    if (stage === 'thinking') {
      setGone(false)
      return
    }
    const id = setTimeout(() => setGone(true), ms)
    return () => clearTimeout(id)
  }, [stage, ms])
  return gone
}

/** Runs the label timeline while 'thinking'; calls onDone once at THINKING_T.done. Returns label index 0–2. */
export function useThinkingTimeline(stage: ThinkingStage, onDone?: () => void): number {
  const [labelIndex, setLabelIndex] = useState(stage === 'thinking' ? 0 : 2)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const doneCalled = useRef(false)
  useEffect(() => {
    if (stage !== 'thinking') {
      setLabelIndex(2)
      return
    }
    const timers = [
      setTimeout(() => setLabelIndex(1), THINKING_T.searching),
      setTimeout(() => setLabelIndex(2), THINKING_T.reading),
      setTimeout(() => {
        if (doneCalled.current) return
        doneCalled.current = true
        onDoneRef.current?.()
      }, THINKING_T.done),
    ]
    return () => timers.forEach(clearTimeout)
  }, [stage])
  return labelIndex
}

/** Label that swaps sequentially: old fades out, then new animates in word by word. */
function WordLabel({ label }: { label: string }) {
  const wordT = useSpring('thinking.word', SPRINGS.word)
  return (
    <AnimatePresence initial={false} mode="wait">
      <motion.span
        key={label}
        className="block whitespace-nowrap"
        style={{ willChange: 'transform, opacity' }}
        exit={{ opacity: 0, y: LABEL_EXIT_Y, transition: LABEL_EXIT }}
      >
        {label.split(' ').map((w, i, arr) => (
          <motion.span
            key={i}
            className="inline-block"
            style={{ willChange: 'transform, opacity' }}
            initial={{ opacity: 0, y: WORD_RISE_Y }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...wordT, delay: i * WORD_STAGGER_S, opacity: linear(WORD_FADE_S, i * WORD_STAGGER_S) }}
          >
            {w}
            {i < arr.length - 1 ? '\u00a0' : ''}
          </motion.span>
        ))}
      </motion.span>
    </AnimatePresence>
  )
}

/**
 * 16px row: spinner + status label ('thinking'), "Done" ('finishing'), "Assistant steps ›" ('results'). Has px-6.
 * Pass `onToggle` + `expanded` to make "Assistant steps" a working disclosure (chevron rotates).
 */
export function ThinkingHeader({
  stage,
  labelIndex,
  expanded = false,
  onToggle,
}: {
  stage: ThinkingStage
  labelIndex: number
  expanded?: boolean
  onToggle?: () => void
}) {
  const chevronT = useSpring('thinking.chevron', SPRINGS.chevron)
  const isResults = stage === 'results'
  const label = stage !== 'thinking' ? DONE_LABEL : LABELS[Math.min(Math.max(labelIndex, 0), 2)]

  return (
    <div className="relative h-4 px-6 text-black/75">
      <AnimatePresence initial={false} mode="wait">
        {isResults ? (
          <motion.button
            key="toggle"
            type="button"
            onClick={onToggle}
            aria-expanded={onToggle ? expanded : undefined}
            className={`flex cursor-pointer items-center font-medium ${text12}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={TOGGLE_ENTER}
          >
            Assistant steps
            <motion.img
              src={chevronIcon}
              alt=""
              width={16}
              height={16}
              initial={false}
              animate={{ rotate: expanded ? 0 : -90 }}
              transition={chevronT}
            />
          </motion.button>
        ) : (
          <motion.div
            key="status"
            className="flex items-center gap-[9px]"
            exit={{ opacity: 0, transition: DONE_EXIT }}
          >
            <Spinner done={stage !== 'thinking'} size={16} />
            <span className={`relative ${text12}`}>
              <WordLabel label={label} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
