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
const SPRINGS = { label: BASE, header: BASE }
const LABEL_SHIFT_Y = 8
const LABEL_EXIT = linear(0.12) // old label fades out fast
const LABEL_ENTER = linear(0.2, 0.04) // new label fades in, slightly overlapping the exit
const HEADER_FADE = linear(0.2)

export const text12 = 'text-[12px] leading-[16px] tracking-[-0.2px]'

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

/** 16px row: spinner + status label ('thinking'), "Done" ('finishing'), "Assistant steps ›" ('results'). Has px-6. */
export function ThinkingHeader({ stage, labelIndex }: { stage: ThinkingStage; labelIndex: number }) {
  const labelT = useSpring('thinking.label', SPRINGS.label)
  const headerT = useSpring('thinking.header', SPRINGS.header)
  const isResults = stage === 'results'
  const label = stage !== 'thinking' ? DONE_LABEL : LABELS[Math.min(Math.max(labelIndex, 0), 2)]

  return (
    <div className="relative h-4 px-6 text-black/75">
      <AnimatePresence initial={false} mode="popLayout">
        {isResults ? (
          <motion.button
            key="toggle"
            type="button"
            className={`flex cursor-pointer items-center font-medium ${text12}`}
            initial={{ opacity: 0, y: LABEL_SHIFT_Y }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -LABEL_SHIFT_Y }}
            transition={{ ...headerT, opacity: HEADER_FADE }}
          >
            Assistant steps
            <img src={chevronIcon} alt="" width={16} height={16} style={{ transform: 'rotate(-90deg)' }} />
          </motion.button>
        ) : (
          <motion.div
            key="status"
            className="flex items-center gap-[9px]"
            exit={{ opacity: 0, y: -LABEL_SHIFT_Y }}
            transition={{ ...headerT, opacity: HEADER_FADE }}
          >
            <Spinner done={stage !== 'thinking'} size={16} />
            <span className={`relative ${text12}`}>
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={label}
                  className="block whitespace-nowrap"
                  initial={{ opacity: 0, y: LABEL_SHIFT_Y }}
                  animate={{ opacity: 1, y: 0, transition: { ...labelT, opacity: LABEL_ENTER } }}
                  exit={{ opacity: 0, y: -LABEL_SHIFT_Y, transition: { ...labelT, opacity: LABEL_EXIT } }}
                >
                  {label}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
