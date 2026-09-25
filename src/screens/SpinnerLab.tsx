import { useEffect, useState } from 'react'
import { Spinner } from '../components/Spinner'
import { TunePanel } from '../lib/tune'

const REPLAY_LOAD_MS = 1800 // replay: how long to spin before flipping to Done

export function SpinnerLab() {
  const [done, setDone] = useState(false)
  const [replay, setReplay] = useState(0)

  useEffect(() => {
    if (!replay) return
    setDone(false)
    const t = setTimeout(() => setDone(true), REPLAY_LOAD_MS)
    return () => clearTimeout(t)
  }, [replay])

  const btn = 'rounded-lg border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-white text-black">
      <div className="flex items-center gap-12">
        <Spinner done={done} size={16} />
        <Spinner done={done} size={64} />
      </div>
      <div className="flex gap-2">
        <button className={btn} onClick={() => setDone((d) => !d)}>
          {done ? 'Set loading' : 'Set done'}
        </button>
        <button className={btn} onClick={() => setReplay((r) => r + 1)}>Replay</button>
      </div>
      <TunePanel />
    </div>
  )
}
