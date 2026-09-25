// Spinner — Figma ".Spinner" (aozdPiDRY1Q3V2WAI3J1Ie, 6013:3395)
//
// Figma frames (16x16, ring r=6.8, stroke 2.4, 0° = 3 o'clock, clockwise):
//   Status=1   dot at 0°              (arc length ~0)
//   Status=2   arc 0°  → 72°          (grows)
//   Status=3   arc 178° → 250°        (travels)
//   Status=4   arc 291° → 363°        (travels)
//   → loops back to Status=1 (collapses into a dot at 360°)
//   Status=Done  filled circle, black 30%, with a knocked-out checkmark.
//
// Loop: tail/head angles are keyframed through those 4 frames on a linear clock.
// Done: spinner shrinks + fades, filled circle springs in, check draws on.
import { useId } from 'react'
import { motion, useTime, useTransform } from 'motion/react'
import { useSpring } from '../lib/tune'

// ---- Tweakables -----------------------------------------------------------
const VIEW = 16
const C = 8 // center
const R = 6.8 // ring radius
const STROKE = 2.4
const TRACK_COLOR = 'rgba(0,0,0,0.08)'
const ARC_COLOR = '#5433EB'
const DONE_COLOR = 'rgba(0,0,0,0.3)'
const CHECK_WIDTH = 1.6
const CHECK_PATH = 'M4.8 8 L7.2 10.4 L11.6 6' // centerline of the Figma knockout

const LOOP_MS = 1000 // one full Status 1→2→3→4→1 cycle
// Keyframes at cycle progress 0, .25, .5, .75, 1 (degrees)
const STOPS = [0, 0.25, 0.5, 0.75, 1]
const TAIL = [0, 0, 178, 291, 360]
const HEAD = [0, 72, 250, 363, 360]

const SPINNER_EXIT_SCALE = 0.6 // spinner shrinks to this as Done arrives
const DONE_ENTER_SCALE = 0.5 // Done circle grows from this
const CHECK_DELAY = 0.08 // s, check starts drawing after the circle begins

// Springs (stiffness + dampingRatio)
const SPRING_EXIT = { stiffness: 800, dampingRatio: 1 }
const SPRING_DONE = { stiffness: 500, dampingRatio: 0.6 }
const SPRING_CHECK = { stiffness: 300, dampingRatio: 1 }
// ---------------------------------------------------------------------------

const CIRC = 2 * Math.PI * R

export function Spinner({ done = false, size = 16 }: { done?: boolean; size?: number }) {
  const exit = useSpring('spinner.exit', SPRING_EXIT)
  const enter = useSpring('spinner.done', SPRING_DONE)
  const check = useSpring('spinner.check', SPRING_CHECK)
  const maskId = useId()

  const time = useTime()
  const p = useTransform(time, (t) => (t % LOOP_MS) / LOOP_MS)
  const tail = useTransform(p, STOPS, TAIL)
  const head = useTransform(p, STOPS, HEAD)
  // Arc = one dash per circumference (so it wraps past 360°), shifted to start at `tail`.
  // A tiny min length keeps the Status=1 dot visible via the round caps.
  const dash = useTransform(() => {
    const len = Math.max(0.01, ((head.get() - tail.get()) / 360) * CIRC)
    return `${len} ${CIRC - len}`
  })
  const offset = useTransform(tail, (d) => (-d / 360) * CIRC)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${VIEW} ${VIEW}`} fill="none" role="img"
      aria-label={done ? 'Done' : 'Loading'} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-2" y="-2" width="20" height="20">
          <rect x="-2" y="-2" width="20" height="20" fill="white" />
          <motion.path d={CHECK_PATH} stroke="black" strokeWidth={CHECK_WIDTH}
            strokeLinecap="round" strokeLinejoin="round" fill="none"
            initial={false}
            animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
            transition={done ? { ...check, delay: CHECK_DELAY } : { duration: 0 }} />
        </mask>
      </defs>

      {/* Loading: track + travelling arc */}
      <motion.g style={{ originX: '50%', originY: '50%', transformBox: 'fill-box' }}
        initial={false}
        animate={{ scale: done ? SPINNER_EXIT_SCALE : 1, opacity: done ? 0 : 1 }}
        transition={exit}>
        <circle cx={C} cy={C} r={R} stroke={TRACK_COLOR} strokeWidth={STROKE} />
        <motion.circle cx={C} cy={C} r={R} stroke={ARC_COLOR} strokeWidth={STROKE}
          strokeLinecap="round" style={{ strokeDasharray: dash, strokeDashoffset: offset }} />
      </motion.g>

      {/* Done: filled circle with knocked-out check */}
      <motion.circle cx={C} cy={C} r={VIEW / 2} fill={DONE_COLOR} mask={`url(#${maskId})`}
        style={{ originX: '50%', originY: '50%', transformBox: 'fill-box' }}
        initial={false}
        animate={{ scale: done ? 1 : DONE_ENTER_SCALE, opacity: done ? 1 : 0 }}
        transition={enter} />
    </svg>
  )
}
