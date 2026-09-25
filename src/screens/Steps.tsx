// Assistant steps: live "thinking" timeline → "Done" → collapsible "Assistant steps".
// Figma: 6013:3215 (Thinking row), 6013:3231 (Done), 6013:3246 / 6013:3294 (Assistant steps), 6013:3330 (list)
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useSpring } from '../lib/tune'
import { BASE, linear } from '../lib/spring'
import searchIcon from '../assets/steps/search.svg'
import { ThinkingHeader, THINKING_T, text12, useThinkingTimeline } from './thinking/_shared'
import favRunningChannel from '../assets/steps/therunningchannel.png'
import favRunRepeat from '../assets/steps/runrepeat.png'
import favReddit from '../assets/steps/reddit.png'
import favRunnersWorld from '../assets/steps/runnersworld.png'

export type StepsStage = 'thinking' | 'finishing' | 'results'

// ─── Timeline (ms from mount of the 'thinking' stage) ─────────────────────────
// Label changes + onDone come from the shared useThinkingTimeline (THINKING_T); rows/chips key off the same moments.
const T = {
  searching: THINKING_T.searching, // "Searching" row (label → "Searching the web...")
  queryFirst: THINKING_T.searching + 400, // first query chip
  queryStagger: 300, // gap between query chips (incl. "+ 12 more")
  reading: THINKING_T.reading, // "Reading" row (label → "Reading 16 sources...")
  sourceFirst: THINKING_T.reading + 400,
  sourceStagger: 300,
}

// ─── Springs (stiffness + dampingRatio; live-tunable with ?tune) ──────────────
// Springs drive movement + scale; opacity is always a linear tween.
const SPRINGS = {
  height: BASE, // list container height (grow / collapse) so content below reflows
  item: BASE, // each step title scaling in (0.85 → 1, left origin)
  chip: { stiffness: 150, dampingRatio: 0.7 }, // each chip popping in (0.6 → 1, center origin)
}
const FADE_S = 0.2
const ITEM_ENTER_SCALE = 0.85 // step titles scale 0.85 → 1 from their left edge
const CHIP_ENTER_SCALE = 0.6 // chips scale 0.6 → 1 from their center
const CHIP_FADE_S = 0.2
const EXPAND_STAGGER_S = 0.03 // per-element delay when re-expanding in results
const COLLAPSE_HEIGHT_DELAY_S = FADE_S // collapse: fade items out first, then close the gap
const DISMISS_FADE_S = 0.15 // entering 'results': items fade out, then height SNAPS closed (no spring)
const STEPS_INSET = 0 // px from the content column (0 = aligns with "Assistant steps"; 25 = with status label text)

// ─── Content ──────────────────────────────────────────────────────────────────
const QUERIES = ['shoes', 'running shoes', 'Nike shoes', 'marathon training shoes']
const SOURCES = [
  { label: 'therunningchannel.com', icon: favRunningChannel },
  { label: 'runrepeat.com', icon: favRunRepeat },
  { label: 'reddit.com', icon: favReddit },
  { label: 'runnersworld.com', icon: favRunnersWorld },
]
const MORE = '+ 12 more'

type Progress = { steps: number; queries: number; sources: number }
const FULL: Progress = { steps: 2, queries: QUERIES.length + 1, sources: SOURCES.length + 1 }
const EMPTY: Progress = { steps: 0, queries: 0, sources: 0 }

// Ordered events → progress snapshot
const EVENTS: { at: number; apply: (p: Progress) => Progress }[] = [
  { at: T.searching, apply: (p) => ({ ...p, steps: 1 }) },
  ...Array.from({ length: QUERIES.length + 1 }, (_, i) => ({
    at: T.queryFirst + i * T.queryStagger,
    apply: (p: Progress) => ({ ...p, queries: i + 1 }),
  })),
  { at: T.reading, apply: (p) => ({ ...p, steps: 2 }) },
  ...Array.from({ length: SOURCES.length + 1 }, (_, i) => ({
    at: T.sourceFirst + i * T.sourceStagger,
    apply: (p: Progress) => ({ ...p, sources: i + 1 }),
  })),
]

const listVariants = {
  exit: (dismiss: boolean) => ({ opacity: 0, transition: linear(dismiss ? DISMISS_FADE_S : FADE_S) }),
}


export function Steps({ stage, onDone }: { stage: StepsStage; onDone?: () => void }) {
  const heightT = useSpring('steps.height', SPRINGS.height)

  const [progress, setProgress] = useState<Progress>(stage === 'thinking' ? EMPTY : FULL)
  const [expanded, setExpanded] = useState(false)
  const [userToggled, setUserToggled] = useState(false)

  // Shared label timeline (also fires onDone once)
  const labelIndex = useThinkingTimeline(stage, onDone)

  // Rows/chips timeline while thinking
  useEffect(() => {
    if (stage !== 'thinking') {
      setProgress(FULL)
      return
    }
    const timers = EVENTS.map((e) => setTimeout(() => setProgress(e.apply), e.at))
    return () => timers.forEach(clearTimeout)
  }, [stage])

  const isResults = stage === 'results'
  // Stage-driven dismissal (not a user tap): quick fade, then snap height closed
  const dismiss = isResults && !userToggled
  const open = !isResults || expanded

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
    <div className="w-full text-black/75">
      <ThinkingHeader
        stage={stage}
        labelIndex={labelIndex}
        expanded={expanded}
        onToggle={() => {
          setUserToggled(true)
          setExpanded((v) => !v)
        }}
      />

      {/* Steps list: no clipping; each element animates on its own */}
      <motion.div
        initial={false}
        animate={{ height: open ? contentH : 0 }}
        transition={
          dismiss
            ? { duration: 0, delay: DISMISS_FADE_S }
            : { ...heightT, delay: open ? 0 : COLLAPSE_HEIGHT_DELAY_S }
        }
      >
        <div ref={innerRef}>
          {/* No initial={false} here: it would suppress every chip/row entrance mounted inside */}
          <AnimatePresence custom={dismiss}>
            {open && (
              <motion.div
                key="list"
                className="px-6 pt-2"
                style={{ paddingLeft: 24 + STEPS_INSET }}
                variants={listVariants}
                exit="exit"
              >
                <StepList progress={progress} stagger={isResults} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

function StepList({ progress, stagger }: { progress: Progress; stagger: boolean }) {
  const { steps } = progress
  // Stagger order (only used when re-expanding in results; live timeline uses delay 0)
  let i = 0
  const d = () => (stagger ? i++ * EXPAND_STAGGER_S : 0)
  return (
    <div className="flex flex-col gap-4">
      {steps >= 1 && (
        <StepRow title="Searching" delay={d()}>
          {QUERIES.slice(0, progress.queries).map((q) => (
            <Chip key={q} delay={d()} icon={<img src={searchIcon} alt="" width={16} height={16} />}>
              {q}
            </Chip>
          ))}
          {progress.queries > QUERIES.length && <Chip key="more" delay={d()}>{MORE}</Chip>}
        </StepRow>
      )}
      {steps >= 2 && (
        <StepRow title="Reading" delay={d()}>
          {SOURCES.slice(0, progress.sources).map((s) => (
            <Chip
              key={s.label}
              delay={d()}
              icon={
                <img src={s.icon} alt="" className="size-3 rounded-full border border-[rgba(5,41,77,0.1)] object-cover" />
              }
            >
              {s.label}
            </Chip>
          ))}
          {progress.sources > SOURCES.length && <Chip key="more" delay={d()}>{MORE}</Chip>}
        </StepRow>
      )}
    </div>
  )
}

/** Scale 0.85 → 1 from the left edge (spring) + linear opacity fade. */
function useItemMotion(delay: number) {
  const itemT = useSpring('steps.item', SPRINGS.item)
  return {
    initial: { opacity: 0, scale: ITEM_ENTER_SCALE },
    animate: { opacity: 1, scale: 1 },
    transition: { ...itemT, delay, opacity: linear(FADE_S, delay) },
    style: { originX: 0 },
  }
}

function StepRow({
  title,
  bold = true,
  delay,
  children,
}: {
  title: string
  bold?: boolean
  delay: number
  children?: React.ReactNode
}) {
  const m = useItemMotion(delay)
  return (
    <div className="flex flex-col gap-1">
      <motion.p {...m} className={`w-fit ${bold ? 'font-semibold' : ''} ${text12}`}>
        {title}
      </motion.p>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}

function Chip({ icon, delay, children }: { icon?: React.ReactNode; delay: number; children: React.ReactNode }) {
  const chipT = useSpring('steps.chip', SPRINGS.chip)
  const m = {
    initial: { opacity: 0, scale: CHIP_ENTER_SCALE },
    animate: { opacity: 1, scale: 1 },
    transition: { ...chipT, delay, opacity: linear(CHIP_FADE_S, delay) },
  }
  return (
    <motion.div
      {...m}
      className={`flex h-7 items-center gap-[2px] rounded-full bg-black/[0.04] ${icon ? 'pl-1' : 'pl-2'} pr-2 py-1`}
    >
      {icon && <span className="flex size-4 shrink-0 items-center justify-center">{icon}</span>}
      <span className={`whitespace-nowrap font-medium text-black ${text12}`}>{children}</span>
    </motion.div>
  )
}
