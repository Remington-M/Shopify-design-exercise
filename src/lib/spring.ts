// Android-style springs (stiffness + dampingRatio) → Motion / CSS.
// damping c = 2 * ζ * sqrt(k * m)

export type Spring = { stiffness: number; dampingRatio: number; mass?: number }

// Jetpack Compose / Android SpringForce constants
export const Stiffness = { High: 10_000, Medium: 1_500, MediumLow: 400, Low: 200, VeryLow: 50 } as const
export const DampingRatio = { HighBouncy: 0.2, MediumBouncy: 0.5, LowBouncy: 0.75, NoBouncy: 1 } as const

export const toDamping = ({ stiffness, dampingRatio, mass = 1 }: Spring) =>
  2 * dampingRatio * Math.sqrt(stiffness * mass)

/** Motion `transition` object: <motion.div transition={spring({ stiffness: 400, dampingRatio: 0.8 })} /> */
export const spring = (s: Spring) => ({
  type: 'spring' as const,
  stiffness: s.stiffness,
  damping: toDamping(s),
  mass: s.mass ?? 1,
  // Motion's defaults (restDelta 0.5px) end the spring early and snap to the target. On small moves
  // that reads as a jerk at the end and swallows sub-pixel overshoot, so run springs to true rest.
  restDelta: 0.001,
  restSpeed: 0.001,
})

/** Simulate 0→1 with unit mass-normalized ODE. Returns positions at 1/fps steps until settled. */
export function simulate(s: Spring, fps = 120, restDelta = 0.001, restSpeed = 0.01) {
  const m = s.mass ?? 1
  const k = s.stiffness
  const c = toDamping(s)
  const dt = 1 / fps
  const sub = 8
  let x = 0
  let v = 0
  const out = [0]
  for (let i = 0; i < fps * 10; i++) {
    for (let j = 0; j < sub; j++) {
      const a = (-k * (x - 1) - c * v) / m
      v += a * (dt / sub)
      x += v * (dt / sub)
    }
    out.push(x)
    if (Math.abs(x - 1) < restDelta && Math.abs(v) < restSpeed) break
  }
  out[out.length - 1] = 1
  return out
}

/** CSS `linear()` easing + duration (ms) for pure-CSS / WAAPI use. */
export function toCss(s: Spring, fps = 60) {
  const pts = simulate(s, fps)
  const duration = Math.round(((pts.length - 1) / fps) * 1000)
  const easing = `linear(${pts.map((p) => +p.toFixed(4)).join(', ')})`
  return { duration, easing, css: `${duration}ms ${easing}` }
}

/** Baseline spring for most motion. */
export const BASE: Spring = { stiffness: 200, dampingRatio: 1 }

/** Opacity is always a linear tween, decoupled from the spring. */
export const linear = (duration = 0.2, delay = 0) => ({ type: 'tween' as const, ease: 'linear' as const, duration, delay })
