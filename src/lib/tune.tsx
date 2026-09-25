// Live spring tuning. Add ?tune to the URL to show the panel.
// const s = useSpring('sheetOpen', { stiffness: 400, dampingRatio: 0.8 })
// <motion.div transition={s} />
import { useSyncExternalStore } from 'react'
import { spring, type Spring } from './spring'

const store = new Map<string, Spring>()
const listeners = new Set<() => void>()
let version = 0
const emit = () => { version++; listeners.forEach((l) => l()) }
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l) }

const enabled = typeof location !== 'undefined' && new URLSearchParams(location.search).has('tune')

export function useSpring(name: string, initial: Spring) {
  useSyncExternalStore(subscribe, () => version)
  if (!store.has(name)) { store.set(name, initial); queueMicrotask(emit) }
  return spring(enabled ? store.get(name)! : initial)
}

function set(name: string, patch: Partial<Spring>) {
  store.set(name, { ...store.get(name)!, ...patch })
  emit()
}

export function TunePanel() {
  useSyncExternalStore(subscribe, () => version)
  if (!enabled) return null
  const entries = [...store.entries()]
  const copy = () =>
    navigator.clipboard.writeText(
      entries.map(([n, s]) => `${n}: { stiffness: ${s.stiffness}, dampingRatio: ${s.dampingRatio} }`).join('\n'),
    )
  return (
    <div className="fixed right-3 top-3 z-[9999] w-64 rounded-xl bg-black/85 p-3 font-mono text-[11px] text-white shadow-xl backdrop-blur">
      {entries.map(([name, s]) => (
        <div key={name} className="mb-3">
          <div className="mb-1 font-bold">{name}</div>
          <label className="block">
            stiffness {s.stiffness}
            <input className="w-full" type="range" min={10} max={3000} value={s.stiffness}
              onChange={(e) => set(name, { stiffness: +e.target.value })} />
          </label>
          <label className="block">
            dampingRatio {s.dampingRatio.toFixed(2)}
            <input className="w-full" type="range" min={0.05} max={1.5} step={0.01} value={s.dampingRatio}
              onChange={(e) => set(name, { dampingRatio: +e.target.value })} />
          </label>
        </div>
      ))}
      <button className="w-full rounded bg-white/15 py-1 hover:bg-white/25" onClick={copy}>Copy values</button>
    </div>
  )
}
