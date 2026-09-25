// Shimmer variant of the "AI thinking" moment: spinner + cycling status label, ghost UI pulsing below.
// Figma: 6023:2077 (ghost / skeleton layout)
import { useRef } from 'react'
import { motion, useTime, useTransform, type MotionValue } from 'motion/react'
import { linear } from '../../lib/spring'
import { ThinkingHeader, useThinkingTimeline, type ThinkingStage } from './_shared'

export type ShimmerStage = ThinkingStage

// ─── Shimmer pulse cascade (Material-style) ──────────────────────────────────
const PULSE_DOWN_MS = 700 // opacity 1 → PULSE_MIN (linear)
const PULSE_UP_MS = 300 // opacity PULSE_MIN → 1 (linear)
const PULSE_MIN = 0.3
const ROW_STAGGER_MS = 30 // start offset between consecutive rows
const HOLD_MS = 1000 // rest after the last row finishes, before looping

const GHOST_FADE = linear(0.15) // 'finishing': ghost fades out

// Ghost fill: Figma is ~4% black; darker so it reads
const GHOST = 'ghost-fill'
const GHOST_HEX = 'rgba(0,0,0,0.075)'

export function Shimmer({ stage, onDone }: { stage: ShimmerStage; onDone?: () => void }) {
  const labelIndex = useThinkingTimeline(stage, onDone)
  return (
    <div className="w-[402px] max-w-full">
      <ThinkingHeader stage={stage} labelIndex={labelIndex} />
      {/* Ghost UI: fades out on 'finishing', unmounted (no height) on 'results' */}
      {stage !== 'results' && (
        <motion.div
          initial={false}
          animate={{ opacity: stage === 'thinking' ? 1 : 0 }}
          transition={GHOST_FADE}
          className="overflow-hidden"
        >
          <Ghost />
        </motion.div>
      )}
    </div>
  )
}

// ─── Ghost layout (Figma 6023:2077, offsets relative to status row) ──────────
const ROWS = 10
const CYCLE_MS = (ROWS - 1) * ROW_STAGGER_MS + PULSE_DOWN_MS + PULSE_UP_MS + HOLD_MS

function pulse(t: number, row: number) {
  const local = (t % CYCLE_MS) - row * ROW_STAGGER_MS
  if (local < 0 || local >= PULSE_DOWN_MS + PULSE_UP_MS) return 1
  if (local < PULSE_DOWN_MS) return 1 - (1 - PULSE_MIN) * (local / PULSE_DOWN_MS)
  return PULSE_MIN + (1 - PULSE_MIN) * ((local - PULSE_DOWN_MS) / PULSE_UP_MS)
}

function Ghost() {
  // One shared clock → every row stays in sync
  const time = useTime()
  const start = useRef<number | null>(null)
  const elapsed = useTransform(time, (t) => {
    if (start.current === null) start.current = t
    return t - start.current
  })
  let r = 0
  const R = ({ className, children }: { className?: string; children?: React.ReactNode }) => (
    <PulseRow clock={elapsed} row={r++} className={className}>
      {children}
    </PulseRow>
  )

  return (
    <div className="flex flex-col pl-[27px] pt-7 pb-6">
      {/* Text block */}
      <div className="flex flex-col gap-2">
        {R({ className: `h-[21px] w-[335px] rounded-lg ${GHOST}` })}
        {R({ className: `h-[21px] w-[290px] rounded-lg ${GHOST}` })}
        {R({ className: `h-[21px] w-[309px] rounded-lg ${GHOST}` })}
      </div>

      {/* Product cards (third bleeds off the right edge) */}
      {R({
        className: 'mt-[39px] flex gap-4',
        children: [0, 1, 2].map((i) => <div key={i} className={`size-[156px] shrink-0 rounded-2xl ${GHOST}`} />),
      })}

      {/* Card meta: title, subtitle, stars */}
      {R({ className: 'mt-[14px] flex gap-[74px]', children: [0, 1].map((i) => <div key={i} className={`h-[11px] w-[99px] rounded-full ${GHOST}`} />) })}
      {R({ className: 'mt-[7px] flex gap-[94px]', children: [0, 1].map((i) => <div key={i} className={`h-[11px] w-[79px] rounded-full ${GHOST}`} />) })}
      {R({ className: 'mt-[7px] flex gap-[105px]', children: [0, 1].map((i) => <Stars key={i} />) })}

      {/* Text block */}
      <div className="mt-8 flex flex-col gap-2">
        {R({ className: `h-[21px] w-[292px] rounded-lg ${GHOST}` })}
        {R({ className: `h-[21px] w-[319px] rounded-lg ${GHOST}` })}
        {R({ className: `h-[21px] w-[309px] rounded-lg ${GHOST}` })}
      </div>
    </div>
  )
}

function PulseRow({
  clock,
  row,
  className,
  children,
}: {
  clock: MotionValue<number>
  row: number
  className?: string
  children?: React.ReactNode
}) {
  const opacity = useTransform(clock, (t) => pulse(t, row))
  return (
    <motion.div className={className} style={{ opacity }}>
      {children}
    </motion.div>
  )
}

function Stars() {
  return (
    <div className="flex gap-[2px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width={12} height={12} viewBox="0 0 24 24" aria-hidden>
          <path
            fill={GHOST_HEX}
            d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"
          />
        </svg>
      ))}
    </div>
  )
}
