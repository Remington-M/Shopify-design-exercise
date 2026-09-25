// Spinner — Figma ".Spinner" (aozdPiDRY1Q3V2WAI3J1Ie, 6013:3395)
//
// Figma: 16x16, track ring r=6.8 stroke 2.4 (black 8%), arc #5433EB round caps.
// Done = filled circle (black 30%) with a knocked-out checkmark.
//
// Loop = After Effects-style trim path, three independent layers on one clock:
//   1. HEAD (trim start): eases 0 → 1 revolution every cycle.
//   2. TAIL (trim end):   same, but `tailDelay` of a cycle behind, with its own ease.
//                         Clamped so the arc never shrinks below `minLength`.
//   3. ROTATION:          whole group turns 360° every `rotationPeriodMs`
//                         (out of sync with the cycle, so the pattern precesses).
// Done: head completes the ring, then spinner fades out and the Done circle springs in.
import { useEffect, useId, useRef } from 'react'
import { animate, motion, useMotionValue, useTime, useTransform } from 'motion/react'
import { useSpring } from '../lib/tune'
import { BASE, linear } from '../lib/spring'

export type Bezier = [number, number, number, number]

// ---- Loop params (all live-tweakable via the `params` prop) ---------------
export const SPINNER_DEFAULTS = {
  cycleMs: 1400, // one head revolution
  tailDelay: 0.25, // fraction of a cycle the tail lags the head
  headEase: [0.4, 0, 0.2, 1] as Bezier,
  tailEase: [0.4, 0, 0.6, 1] as Bezier,
  minLength: 0.06, // min arc, fraction of circumference
  rotationPeriodMs: 2300, // whole-group rotation, deliberately not a multiple of cycleMs
}
export type SpinnerParams = typeof SPINNER_DEFAULTS

// ---- Visuals ---------------------------------------------------------------
const VIEW = 16
const C = 8 // center
const R = 6.8 // ring radius
const STROKE = 2.4
const TRACK_COLOR = 'rgba(0,0,0,0.08)'
const ARC_COLOR = '#5433EB'
const DONE_COLOR = 'rgba(0,0,0,0.3)'
const CHECK_WIDTH = 1.6
const CHECK_PATH = 'M4.8 8 L7.2 10.4 L11.6 6' // centerline of the Figma knockout

// ---- Done transition -------------------------------------------------------
const FINISH_S = 0.35 // head closes the ring before handing off to Done
const FINISH_EASE: Bezier = [0.4, 0, 0.2, 1]
const SPINNER_EXIT_SCALE = 0.6 // spinner shrinks to this as Done arrives
const DONE_ENTER_SCALE = 0.5 // Done circle grows from this
const CHECK_DELAY = 0.08 // s, after the Done circle starts
const SPRING_EXIT = BASE
const SPRING_DONE = BASE
const SPRING_CHECK = BASE
const FADE_DURATION = 0.2 // s, opacity is a linear tween, decoupled from the springs
// ---------------------------------------------------------------------------

const CIRC = 2 * Math.PI * R

/** CSS-style cubic-bezier(x1,y1,x2,y2) evaluated at x in [0,1]. */
function bezier([x1, y1, x2, y2]: Bezier, x: number) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by
  let t = x
  for (let i = 0; i < 8; i++) {
    const err = ((ax * t + bx) * t + cx) * t - x
    const d = (3 * ax * t + 2 * bx) * t + cx
    if (Math.abs(err) < 1e-5 || Math.abs(d) < 1e-6) break
    t -= err / d
  }
  t = Math.min(1, Math.max(0, t))
  return ((ay * t + by) * t + cy) * t
}

/** Absolute position in revolutions of a point that eases one lap per cycle. */
const lap = (cycles: number, ease: Bezier) => Math.floor(cycles) + bezier(ease, cycles - Math.floor(cycles))

/** Arc at time t (ms): start (revolutions, incl. rotation) and length (fraction of circle). */
function trim(t: number, p: SpinnerParams) {
  const cycles = t / p.cycleMs
  const head = lap(cycles, p.headEase)
  const tail = Math.min(lap(cycles - p.tailDelay, p.tailEase), head - p.minLength)
  const rotation = t / p.rotationPeriodMs
  return { start: tail + rotation, len: Math.min(1, head - tail) }
}

export function Spinner({ done = false, size = 16, params }: {
  done?: boolean
  size?: number
  params?: Partial<SpinnerParams>
}) {
  const exit = useSpring('spinner.exit', SPRING_EXIT)
  const enter = useSpring('spinner.done', SPRING_DONE)
  const check = useSpring('spinner.check', SPRING_CHECK)
  const maskId = useId()

  const p = useRef(SPINNER_DEFAULTS)
  p.current = { ...SPINNER_DEFAULTS, ...params }

  const time = useTime()
  const finish = useMotionValue(0) // 0 = looping, 1 = ring closed
  const frozen = useRef<{ t: number; start: number; len: number } | null>(null)

  useEffect(() => {
    if (!done) {
      frozen.current = null
      finish.jump(0)
      return
    }
    const t = time.get()
    frozen.current = { t, ...trim(t, p.current) }
    const c = animate(finish, 1, { duration: FINISH_S, ease: FINISH_EASE })
    return () => c.stop()
  }, [done, finish, time])

  const arc = useTransform(() => {
    const t = time.get()
    const f = finish.get()
    const fr = frozen.current
    if (!fr) return trim(t, p.current)
    // Hand-off: keep rotating from where we were, head sweeps round to close the ring.
    return { start: fr.start + (t - fr.t) / p.current.rotationPeriodMs, len: fr.len + (1 - fr.len) * f }
  })
  const dash = useTransform(arc, ({ len }) => {
    const l = Math.max(0.001, len) * CIRC
    return `${l} ${Math.max(0, CIRC - l)}`
  })
  const offset = useTransform(arc, ({ start }) => -(start % 1) * CIRC)

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
            transition={done
              ? { ...check, delay: FINISH_S + CHECK_DELAY, opacity: linear(FADE_DURATION, FINISH_S + CHECK_DELAY) }
              : { duration: 0 }} />
        </mask>
      </defs>

      {/* Loading: track + trim-path arc */}
      <motion.g style={{ originX: '50%', originY: '50%', transformBox: 'fill-box' }}
        initial={false}
        animate={{ scale: done ? SPINNER_EXIT_SCALE : 1, opacity: done ? 0 : 1 }}
        transition={done
          ? { ...exit, delay: FINISH_S, opacity: linear(FADE_DURATION, FINISH_S) }
          : { ...exit, opacity: linear(FADE_DURATION) }}>
        <circle cx={C} cy={C} r={R} stroke={TRACK_COLOR} strokeWidth={STROKE} />
        <motion.circle cx={C} cy={C} r={R} stroke={ARC_COLOR} strokeWidth={STROKE}
          strokeLinecap="round" style={{ strokeDasharray: dash, strokeDashoffset: offset }} />
      </motion.g>

      {/* Done: filled circle with knocked-out check */}
      <motion.circle cx={C} cy={C} r={VIEW / 2} fill={DONE_COLOR} mask={`url(#${maskId})`}
        style={{ originX: '50%', originY: '50%', transformBox: 'fill-box' }}
        initial={false}
        animate={{ scale: done ? 1 : DONE_ENTER_SCALE, opacity: done ? 1 : 0 }}
        transition={done
          ? { ...enter, delay: FINISH_S, opacity: linear(FADE_DURATION, FINISH_S) }
          : { ...enter, opacity: linear(FADE_DURATION) }} />
    </svg>
  )
}
