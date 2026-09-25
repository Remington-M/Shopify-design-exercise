import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { TunePanel, useSpring } from './lib/tune'
import { BASE, linear } from './lib/spring'
import { StatusBar } from './components/StatusBar'
import { QUERY, SearchBar } from './components/SearchBar'
import { Compose } from './screens/Compose'
import { Steps } from './screens/Steps'
import { Results } from './screens/Results'
import { SpinnerLab } from './screens/SpinnerLab'
import cross from './assets/cross.svg'
import keyboard from './assets/keyboard.png'

type Stage = 'empty' | 'active' | 'thinking' | 'finishing' | 'results'
const STAGES: Stage[] = ['empty', 'active', 'thinking', 'finishing', 'results']
const FINISH_HOLD_MS = 900

// Typing: per-character with a little human jitter
const TYPE_START_MS = 350
const TYPE_IDLE_MS = 500 // cursor goes back to blinking after this
const charDelay = (i: number, ch: string) => (ch === ' ' ? 150 : 85) + Math.round(30 * Math.sin(i * 1.7))

const params = new URLSearchParams(location.search)
const initialStage = (STAGES.find((s) => s === params.get('stage')) ?? 'empty') as Stage

export default function App() {
  if (params.get('view') === 'spinner') return <SpinnerLab />
  return <Prototype />
}

function Prototype() {
  const [stage, setStage] = useState<Stage>(initialStage)
  const [run, setRun] = useState(0) // bump to remount the flow on reset
  const composing = stage === 'empty' || stage === 'active'
  const base = useSpring('base', BASE)
  const query = useSpring('searchbar.query', BASE)
  const keyboardSpring = useSpring('keyboard', { stiffness: 100, dampingRatio: 1 })

  const [typed, setTyped] = useState(initialStage === 'empty' || initialStage === 'active' ? '' : QUERY)
  const [typing, setTyping] = useState(false)
  const [keyboardGone, setKeyboardGone] = useState(!(initialStage === 'empty' || initialStage === 'active'))
  useEffect(() => {
    if (stage !== 'active') return
    let i = 0
    let t: number
    const tick = () => {
      i++
      setTyped(QUERY.slice(0, i))
      setTyping(true)
      t = i < QUERY.length
        ? window.setTimeout(tick, charDelay(i, QUERY[i]))
        : window.setTimeout(() => setTyping(false), TYPE_IDLE_MS)
    }
    t = window.setTimeout(tick, TYPE_START_MS)
    return () => clearTimeout(t)
  }, [stage, run])

  const finishTimer = useRef<number>(undefined)
  useEffect(() => {
    if (stage !== 'finishing') return
    finishTimer.current = window.setTimeout(() => setStage('results'), FINISH_HOLD_MS)
    return () => clearTimeout(finishTimer.current)
  }, [stage])

  const jump = (s: Stage) => {
    setTyped(s === 'empty' || s === 'active' ? '' : QUERY)
    setTyping(false)
    setKeyboardGone(!(s === 'empty' || s === 'active'))
    setStage(s)
    setRun((r) => r + 1)
  }
  const reset = () => jump('empty')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e9e9ec] py-6">
      <LayoutGroup key={run}>
        <div className="relative h-[874px] w-[402px] shrink-0 overflow-hidden rounded-[40px] bg-[#fdfdfd] shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
          <StatusBar />

          {/* Tap target: lower half of the empty screen → active */}
          {stage === 'empty' && (
            <button aria-label="Start typing" onClick={() => setStage('active')} className="absolute inset-x-0 bottom-0 z-10 h-1/2" />
          )}

          <AnimatePresence>
            {composing && (
              <motion.div
                key="close"
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ ...base, opacity: linear(0.15) }}
                className="absolute right-5 top-[62px] z-20 flex size-10 items-center justify-center rounded-full border-[0.5px] border-[rgba(24,59,78,0.06)] bg-white/85 shadow-[0_0_0.5px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.12)]"
              >
                <img src={cross} className="size-5" alt="" />
              </motion.div>
            )}
          </AnimatePresence>

          {composing && <Compose typed={typed} />}

          {/* Conversation column: title → steps → results */}
          {!composing && (
            <div className="absolute inset-x-0 bottom-0 top-[74px] overflow-y-auto pb-[120px]">
              <div className="px-6">
                <motion.h1
                  layoutId="query"
                  transition={query}
                  className="whitespace-nowrap text-[24px] font-semibold leading-[26px] tracking-[-0.6px] text-black"
                >
                  {QUERY}
                </motion.h1>
              </div>
              <div className="mt-3">
                <Steps stage={stage} onDone={() => setStage('finishing')} />
              </div>
              {stage === 'results' && <Results />}
            </div>
          )}

          {/* Keyboard (baked). Critically damped, and unmounted once it's off screen. */}
          {!keyboardGone && (
            <motion.img
              src={keyboard}
              alt=""
              initial={false}
              animate={{ y: composing ? 0 : 342 }}
              transition={keyboardSpring}
              onUpdate={(v) => { if (!composing && Number(v.y) >= 341) setKeyboardGone(true) }}
              className="pointer-events-none absolute left-0 top-[532px] z-10 h-[342px] w-[402px]"
            />
          )}

          <SearchBar
            mode={composing ? stage : 'docked'}
            typed={typed}
            typing={typing}
            onSend={() => setStage('thinking')}
            onBack={reset}
          />
        </div>
      </LayoutGroup>

      {/* Stage jumper for review */}
      <div className="fixed bottom-3 left-3 flex gap-1 font-mono text-[11px]">
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => jump(s)}
            className={`rounded px-2 py-1 ${stage === s ? 'bg-black text-white' : 'bg-white/70 text-black'}`}
          >
            {s}
          </button>
        ))}
      </div>
      <TunePanel />
    </div>
  )
}
