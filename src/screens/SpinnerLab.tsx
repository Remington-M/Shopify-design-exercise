import { useEffect, useState } from 'react'
import { Spinner, SPINNER_DEFAULTS, type Bezier, type SpinnerParams } from '../components/Spinner'
import { TunePanel } from '../lib/tune'

const REPLAY_LOAD_MS = 2500 // replay: how long to spin before flipping to Done

type NumKey = 'cycleMs' | 'tailDelay' | 'minLength' | 'rotationPeriodMs'
const NUM_SLIDERS: { key: NumKey; min: number; max: number; step: number }[] = [
  { key: 'cycleMs', min: 300, max: 4000, step: 10 },
  { key: 'tailDelay', min: 0, max: 0.9, step: 0.01 },
  { key: 'minLength', min: 0, max: 0.5, step: 0.005 },
  { key: 'rotationPeriodMs', min: 300, max: 8000, step: 10 },
]
const BEZ_LABELS = ['x1', 'y1', 'x2', 'y2']

export function SpinnerLab() {
  const [done, setDone] = useState(false)
  const [replay, setReplay] = useState(0)
  const [params, setParams] = useState<SpinnerParams>(SPINNER_DEFAULTS)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!replay) return
    setDone(false)
    const t = setTimeout(() => setDone(true), REPLAY_LOAD_MS)
    return () => clearTimeout(t)
  }, [replay])

  const setEase = (key: 'headEase' | 'tailEase', i: number, v: number) =>
    setParams((p) => {
      const e = [...p[key]] as Bezier
      e[i] = v
      return { ...p, [key]: e }
    })

  const copy = () => {
    navigator.clipboard.writeText(JSON.stringify(params, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  const btn = 'rounded-lg border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-white p-8 text-black">
      <div className="flex items-center gap-12">
        <Spinner done={done} size={16} params={params} />
        <Spinner done={done} size={64} params={params} />
        <Spinner done={done} size={200} params={params} />
      </div>

      <div className="flex gap-2">
        <button className={btn} onClick={() => setDone((d) => !d)}>
          {done ? 'Set loading' : 'Set done'}
        </button>
        <button className={btn} onClick={() => setReplay((r) => r + 1)}>Replay</button>
        <button className={btn} onClick={() => setParams(SPINNER_DEFAULTS)}>Reset params</button>
        <button className={btn} onClick={copy}>{copied ? 'Copied' : 'Copy params'}</button>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-x-8 gap-y-3 font-mono text-xs sm:grid-cols-2">
        {NUM_SLIDERS.map(({ key, min, max, step }) => (
          <label key={key} className="block">
            {key}: {params[key]}
            <input className="w-full" type="range" min={min} max={max} step={step} value={params[key]}
              onChange={(e) => setParams((p) => ({ ...p, [key]: +e.target.value }))} />
          </label>
        ))}
        {(['headEase', 'tailEase'] as const).map((key) => (
          <div key={key}>
            <div className="mb-1 font-bold">{key}: [{params[key].join(', ')}]</div>
            {params[key].map((v, i) => (
              <label key={i} className="block">
                {BEZ_LABELS[i]} {v.toFixed(2)}
                <input className="w-full" type="range" step={0.01} value={v}
                  min={i % 2 === 0 ? 0 : -1} max={i % 2 === 0 ? 1 : 2}
                  onChange={(e) => setEase(key, i, +e.target.value)} />
              </label>
            ))}
          </div>
        ))}
      </div>

      <TunePanel />
    </div>
  )
}
