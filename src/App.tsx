import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useSpring } from './lib/tune'
import { BASE, linear } from './lib/spring'
import { StatusBar } from './components/StatusBar'
import { DROP, QUERY, SearchBar, Y_SPRING } from './components/SearchBar'
import { Compose } from './screens/Compose'
import { Steps, type StepsStage } from './screens/Steps'
import type { ComponentType } from 'react'
import { Results } from './screens/Results'
import { SpinnerLab } from './screens/SpinnerLab'
import cross from './assets/cross.svg'
import keyboard from './assets/keyboard.png'

type Stage = 'empty' | 'active' | 'thinking' | 'finishing' | 'results'
const STAGES: Stage[] = ['empty', 'active', 'thinking', 'finishing', 'results']
const FINISH_HOLD_MS = 900 // "Done" → "Assistant steps" swap, once results are mostly in
const TITLE_START_S = 0.45 // let the bar settle first
const TITLE_WORD_FADE_S = 0.4
const TITLE_RISE_Y = 12
const TITLE_WORD_STAGGER_S = 0.033
const STEPS_DELAY_MS = 1100 // loader arrives as the title is almost in
const RESULTS_DELAY_MS = 200 // after 'finishing' starts: let the steps dismiss, then results animate in under "Done"

// Typing: per-character with a little human jitter
const TYPE_START_MS = 350
const TYPE_IDLE_MS = 500 // cursor goes back to blinking after this
const charDelay = (i: number, ch: string) => (ch === ' ' ? 75 : 42) + Math.round(15 * Math.sin(i * 1.7))

const params = new URLSearchParams(location.search)

// Thinking variants. Anything in src/screens/thinking/*.tsx that exports a component named after
// its file (e.g. Shimmer.tsx → Shimmer) is picked up automatically.
const ORDER = ['steps', 'shimmer', 'browse']
type ThinkingProps = { stage: StepsStage; onDone?: () => void }
const found = import.meta.glob<Record<string, ComponentType<ThinkingProps>>>('./screens/thinking/*.tsx', { eager: true })
const VARIANTS: { id: string; label: string; C: ComponentType<ThinkingProps> }[] = [
  { id: 'steps', label: 'Steps', C: Steps },
  ...Object.entries(found).flatMap(([path, mod]) => {
    const name = path.split('/').pop()!.replace('.tsx', '')
    return mod[name] ? [{ id: name.toLowerCase(), label: name, C: mod[name] }] : []
  }),
].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id))
const initialStage = (STAGES.find((s) => s === params.get('stage')) ?? 'empty') as Stage

export default function App() {
  if (params.get('view') === 'spinner') return <SpinnerLab />
  return <Prototype />
}

function Prototype() {
  const [stage, setStage] = useState<Stage>(initialStage)
  const [variant, setVariant] = useState(() => VARIANTS.find((v) => v.id === params.get('v'))?.id ?? 'steps')
  const Thinking = (VARIANTS.find((v) => v.id === variant) ?? VARIANTS[0]).C
  const [run, setRun] = useState(0) // bump to remount the flow on reset
  const composing = stage === 'empty' || stage === 'active'
  const base = useSpring('base', BASE)
  // Keyboard shares the search bar's Y spring so they drop together (unmounted once off screen)
  const keyboardSpring = useSpring('searchbar.y', Y_SPRING)

  const [typed, setTyped] = useState(initialStage === 'empty' || initialStage === 'active' ? '' : QUERY)
  const [typing, setTyping] = useState(false)
  const [showResults, setShowResults] = useState(initialStage === 'results' || initialStage === 'finishing')
  useEffect(() => {
    if (stage === 'results') return // already mounted during 'finishing' (or jumped here)
    if (stage !== 'finishing') { setShowResults(false); return }
    const t = window.setTimeout(() => setShowResults(true), RESULTS_DELAY_MS)
    return () => clearTimeout(t)
  }, [stage, run])
  const titleSpring = useSpring('title', { stiffness: 150, dampingRatio: 0.55 })
  const [showSteps, setShowSteps] = useState(initialStage !== 'thinking')
  useEffect(() => {
    if (stage !== 'thinking') { if (!composing) setShowSteps(true); return }
    const t = window.setTimeout(() => setShowSteps(true), STEPS_DELAY_MS)
    return () => clearTimeout(t)
  }, [stage, run, composing])
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
    setShowSteps(s !== 'thinking' && s !== 'empty' && s !== 'active')
    setShowResults(s === 'results')
    setStage(s)
    setRun((r) => r + 1)
  }
  const reset = () => jump('empty')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-[#e9e9ec] py-8">
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
                {/* Title: per-word linear fade */}
                <h1 className="whitespace-nowrap text-[24px] font-semibold leading-[26px] tracking-[-0.6px] text-black">
                  {QUERY.split(' ').map((w, i) => (
                    <motion.span
                      key={i}
                      className="inline-block whitespace-pre"
                      style={{ willChange: 'transform, opacity' }}
                      initial={{ opacity: 0, y: TITLE_RISE_Y }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        y: { ...titleSpring, delay: TITLE_START_S + i * TITLE_WORD_STAGGER_S },
                        opacity: linear(TITLE_WORD_FADE_S, TITLE_START_S + i * TITLE_WORD_STAGGER_S),
                      }}
                    >
                      {w + (i < QUERY.split(' ').length - 1 ? ' ' : '')}
                    </motion.span>
                  ))}
                </h1>
              </div>
              <div className="mt-3">
                {showSteps && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ opacity: linear(0.35) }}>
                    <Thinking stage={stage} onDone={() => setStage('finishing')} />
                  </motion.div>
                )}
              </div>
              {showResults && <Results />}
            </div>
          )}

          {/* Keyboard (baked). Critically damped, and unmounted once it's off screen. */}
          {!keyboardGone && (
            <motion.img
              src={keyboard}
              alt=""
              initial={false}
              animate={{ y: composing ? 0 : Math.max(342, DROP) }}
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

      {/* Variant switcher */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-black/45">Searching state</p>
        <div className="flex gap-1 rounded-full bg-white/80 p-1 text-[13px] font-medium shadow-sm backdrop-blur">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            onClick={() => {
              setVariant(v.id)
              const u = new URL(location.href); u.searchParams.set('v', v.id); history.replaceState(null, '', u)
              jump('thinking')
            }}
            className={`rounded-full px-3 py-1 ${variant === v.id ? 'bg-black text-white' : 'text-black/70'}`}
          >
            {v.label}
          </button>
        ))}
        </div>
      </div>


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
    </div>
  )
}
