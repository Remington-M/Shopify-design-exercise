// Assistant steps: live "thinking" timeline → "Done" → collapsible "Assistant steps".
// Figma: 6013:3215 (Thinking row), 6013:3231 (Done), 6013:3246 / 6013:3294 (Assistant steps), 6013:3330 (list)
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Spinner } from '../components/Spinner'
import { useSpring } from '../lib/tune'
import searchIcon from '../assets/steps/search.svg'
import chevronIcon from '../assets/steps/chevron-down.svg'
import favRunningChannel from '../assets/steps/therunningchannel.png'
import favRunRepeat from '../assets/steps/runrepeat.png'
import favReddit from '../assets/steps/reddit.png'
import favRunnersWorld from '../assets/steps/runnersworld.png'

export type StepsStage = 'thinking' | 'finishing' | 'results'

// ─── Timeline (ms from mount of the 'thinking' stage) ─────────────────────────
const T = {
  thinkingStep: 600, // "Thinking" row appears in the list
  searching: 1600, // "Searching" row + label → "Searching the web..."
  queryFirst: 2000, // first query chip
  queryStagger: 300, // gap between query chips (incl. "+ 12 more")
  reading: 4000, // "Reading" row + label → "Reading 16 sources..."
  sourceFirst: 4400,
  sourceStagger: 300,
  done: 7000, // onDone()
}

// ─── Springs (stiffness + dampingRatio; live-tunable with ?tune) ──────────────
const SPRINGS = {
  height: { stiffness: 380, dampingRatio: 0.9 }, // list container height (grow / collapse)
  line: { stiffness: 300, dampingRatio: 1 }, // vertical line growing down to the last tick
  row: { stiffness: 500, dampingRatio: 0.85 }, // step rows entering
  chip: { stiffness: 700, dampingRatio: 0.6 }, // chips popping in
  label: { stiffness: 600, dampingRatio: 1 }, // status label swap
  chevron: { stiffness: 500, dampingRatio: 0.8 }, // chevron rotate
}
const ROW_ENTER_Y = 6
const CHIP_ENTER_SCALE = 0.6
const LABEL_SHIFT_Y = 8

// ─── Content ──────────────────────────────────────────────────────────────────
const QUERIES = ['shoes', 'running shoes', 'Nike shoes', 'marathon training shoes']
const SOURCES = [
  { label: 'therunningchannel.com', icon: favRunningChannel },
  { label: 'runrepeat.com', icon: favRunRepeat },
  { label: 'reddit.com', icon: favReddit },
  { label: 'runnersworld.com', icon: favRunnersWorld },
]
const MORE = '+ 12 more'
const TOTAL_SOURCES = 16
const LABELS = {
  thinking: 'Thinking...',
  searching: 'Searching the web...',
  reading: `Reading ${TOTAL_SOURCES} sources...`,
  done: 'Done',
}

type Phase = 'none' | 'thinking' | 'searching' | 'reading'
type Progress = { phase: Phase; steps: number; queries: number; sources: number }
const FULL: Progress = { phase: 'reading', steps: 3, queries: QUERIES.length + 1, sources: SOURCES.length + 1 }
const EMPTY: Progress = { phase: 'none', steps: 0, queries: 0, sources: 0 }

// Ordered events → progress snapshot
const EVENTS: { at: number; apply: (p: Progress) => Progress }[] = [
  { at: T.thinkingStep, apply: (p) => ({ ...p, phase: 'thinking', steps: 1 }) },
  { at: T.searching, apply: (p) => ({ ...p, phase: 'searching', steps: 2 }) },
  ...Array.from({ length: QUERIES.length + 1 }, (_, i) => ({
    at: T.queryFirst + i * T.queryStagger,
    apply: (p: Progress) => ({ ...p, queries: i + 1 }),
  })),
  { at: T.reading, apply: (p) => ({ ...p, phase: 'reading', steps: 3 }) },
  ...Array.from({ length: SOURCES.length + 1 }, (_, i) => ({
    at: T.sourceFirst + i * T.sourceStagger,
    apply: (p: Progress) => ({ ...p, sources: i + 1 }),
  })),
]

const text12 = 'text-[12px] leading-[16px] tracking-[-0.2px]'

export function Steps({ stage, onDone }: { stage: StepsStage; onDone?: () => void }) {
  const heightT = useSpring('steps.height', SPRINGS.height)
  const labelT = useSpring('steps.label', SPRINGS.label)
  const chevronT = useSpring('steps.chevron', SPRINGS.chevron)

  const [progress, setProgress] = useState<Progress>(stage === 'thinking' ? EMPTY : FULL)
  const [expanded, setExpanded] = useState(false)

  // Run the timeline while thinking
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const doneCalled = useRef(false)
  useEffect(() => {
    if (stage !== 'thinking') {
      setProgress(FULL)
      return
    }
    const timers = EVENTS.map((e) => setTimeout(() => setProgress(e.apply), e.at))
    timers.push(
      setTimeout(() => {
        if (doneCalled.current) return
        doneCalled.current = true
        onDoneRef.current?.()
      }, T.done),
    )
    return () => timers.forEach(clearTimeout)
  }, [stage])

  const isResults = stage === 'results'
  const open = !isResults || expanded
  const label =
    stage !== 'thinking'
      ? LABELS.done
      : progress.phase === 'reading'
        ? LABELS.reading
        : progress.phase === 'searching'
          ? LABELS.searching
          : LABELS.thinking

  // Measure list content so height changes (growth + collapse) spring instead of jumping
  const innerRef = useRef<HTMLDivElement>(null)
  const [contentH, setContentH] = useState(0)
  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    setContentH(el.offsetHeight)
    const ro = new ResizeObserver(() => setContentH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="w-full px-6 text-black/75">
      {/* Header row */}
      <div className="relative h-4">
        <AnimatePresence initial={false} mode="popLayout">
          {isResults ? (
            <motion.button
              key="toggle"
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className={`flex cursor-pointer items-center font-medium ${text12}`}
              initial={{ opacity: 0, y: LABEL_SHIFT_Y }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -LABEL_SHIFT_Y }}
              transition={labelT}
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
              exit={{ opacity: 0, y: -LABEL_SHIFT_Y }}
              transition={labelT}
            >
              <Spinner done={stage !== 'thinking'} />
              <span className={`relative ${text12}`}>
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={label}
                    className="block whitespace-nowrap"
                    initial={{ opacity: 0, y: LABEL_SHIFT_Y }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -LABEL_SHIFT_Y }}
                    transition={labelT}
                  >
                    {label}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Steps list */}
      <motion.div
        className="overflow-hidden"
        initial={false}
        animate={{ height: open ? contentH : 0, opacity: open ? 1 : 0 }}
        transition={heightT}
      >
        <div ref={innerRef} className="pt-2">
          <StepList progress={progress} />
        </div>
      </motion.div>
    </div>
  )
}

function StepList({ progress }: { progress: Progress }) {
  const lineT = useSpring('steps.line', SPRINGS.line)
  const listRef = useRef<HTMLDivElement>(null)
  const lastTickRef = useRef<HTMLDivElement>(null)
  const [lineH, setLineH] = useState(0)

  // Line runs from the top of the list down to the last visible tick
  useLayoutEffect(() => {
    const list = listRef.current
    const tick = lastTickRef.current
    if (!list || !tick) return setLineH(0)
    // offsetTop chain is transform-free (unlike getBoundingClientRect on entering rows)
    let y = 0
    let n: HTMLElement | null = tick
    while (n && n !== list) {
      y += n.offsetTop
      n = n.offsetParent as HTMLElement | null
    }
    setLineH(y + 1)
  }, [progress.steps, progress.queries, progress.sources])

  const { steps } = progress
  return (
    <div ref={listRef} className="relative pt-1">
      <motion.div
        className="absolute left-0 top-0 w-px rounded-full bg-black/10"
        initial={{ height: 0 }}
        animate={{ height: lineH }}
        transition={lineT}
      />
      <div className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {steps >= 1 && (
            <StepRow key="thinking" title="Thinking" bold={false} tickRef={steps === 1 ? lastTickRef : undefined} />
          )}
          {steps >= 2 && (
            <StepRow key="searching" title="Searching" tickRef={steps === 2 ? lastTickRef : undefined}>
              {QUERIES.slice(0, progress.queries).map((q) => (
                <Chip key={q} icon={<img src={searchIcon} alt="" width={16} height={16} />}>
                  {q}
                </Chip>
              ))}
              {progress.queries > QUERIES.length && <Chip key="more">{MORE}</Chip>}
            </StepRow>
          )}
          {steps >= 3 && (
            <StepRow key="reading" title="Reading" tickRef={steps === 3 ? lastTickRef : undefined}>
              {SOURCES.slice(0, progress.sources).map((s) => (
                <Chip
                  key={s.label}
                  icon={
                    <img
                      src={s.icon}
                      alt=""
                      className="size-3 rounded-full border border-[rgba(5,41,77,0.1)] object-cover"
                    />
                  }
                >
                  {s.label}
                </Chip>
              ))}
              {progress.sources > SOURCES.length && <Chip key="more">{MORE}</Chip>}
            </StepRow>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function StepRow({
  title,
  bold = true,
  tickRef,
  children,
}: {
  title: string
  bold?: boolean
  tickRef?: React.Ref<HTMLDivElement>
  children?: React.ReactNode
}) {
  const rowT = useSpring('steps.row', SPRINGS.row)
  return (
    <motion.div
      className="flex items-start gap-[6px]"
      initial={{ opacity: 0, y: ROW_ENTER_Y }}
      animate={{ opacity: 1, y: 0 }}
      transition={rowT}
    >
      <div className="w-[10px] shrink-0 pt-2">
        <div ref={tickRef} className="h-px w-full rounded-full bg-[#e3e3e3]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className={`${bold ? 'font-semibold' : ''} ${text12}`}>{title}</p>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </motion.div>
  )
}

function Chip({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  const chipT = useSpring('steps.chip', SPRINGS.chip)
  return (
    <motion.div
      className={`flex h-7 items-center gap-[2px] rounded-full bg-black/[0.04] ${icon ? 'pl-1' : 'pl-2'} pr-2 py-1`}
      initial={{ opacity: 0, scale: CHIP_ENTER_SCALE }}
      animate={{ opacity: 1, scale: 1 }}
      transition={chipT}
    >
      {icon && <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span>}
      <span className={`whitespace-nowrap font-medium text-black ${text12}`}>{children}</span>
    </motion.div>
  )
}
