import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { EXERCISES } from '../data/exercises'
import { getCoaching } from '../data/coaching'
import { restSeconds, targetParts, weightIncrement } from '../engine/progression'
import { ValueRoller } from '../components/Rollers'
import ExerciseDemo from '../components/ExerciseDemo'
import DetailsSheet, { DetailRow, DetailsButton } from '../components/DetailsSheet'
import { alternativesFor, sameMovements } from '../engine/alternatives'
import { canDo } from '../engine/equipment'
import { CheckIcon, XIcon } from '../components/icons'

function mmss(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// One odometer digit: a 0-9 strip that rolls vertically to the current value,
// so the rest countdown ticks over like an instrument instead of re-rendering.
const DIGITS = Array.from({ length: 10 }, (_, i) => i)
function DigitRoll({ d }: { d: number }) {
  return (
    <span className="rt-digit">
      <span className="rt-strip" style={{ transform: `translateY(${-d}em)` }}>
        {DIGITS.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  )
}

// When the real advance fires during the completion morph (full animation is
// 0.56s — see .set-pop in styles.css). Kept brief (Apple HIG: quick +
// purposeful for frequent interactions); a second tap skips straight through.
const POP_MS = 500
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Session({
  onComplete,
  onQuit,
  onShowHow
}: {
  onComplete: () => void
  onQuit: () => void
  onShowHow: (exerciseId: string) => void
}) {
  const { state, mark, abandon, advanceSet, setRest, swapExercise } = useStore()
  const [reps, setReps] = useState<number | null>(null)
  const [weight, setWeight] = useState<number | null>(null)
  // Three focus items on screen (name, looping demo, primary action); the
  // dials, How-to, Swap and Skip live in the Details sheet.
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [, setTick] = useState(0)
  // Completion-beat state: `pop` increments to replay the morph; `pendingRef`
  // holds the timer that fires the actual advance once the beat has played.
  const [pop, setPop] = useState(0)
  const pendingRef = useRef<number | null>(null)
  const detailsBtnRef = useRef<HTMLDivElement>(null)
  useEffect(
    () => () => {
      if (pendingRef.current != null) window.clearTimeout(pendingRef.current)
    },
    []
  )

  const a = state.active
  const units = state.profile?.units ?? 'kg'
  const cursor = a?.cursor ?? -1
  // A swap replaces the exercise without moving the cursor, so per-exercise
  // resets key on the exercise id too.
  const exId = a?.plan[a.cursor]?.exerciseId
  // Set position and rest timer live in the store so they survive a trip to the
  // How-to screen (which unmounts this component) and even an app reload.
  const setIdx = a?.setIdx ?? 0
  const restEndsAt = a?.restEndsAt ?? null

  // Close the details when the workout advances to the next exercise.
  useEffect(() => {
    setDetailsOpen(false)
  }, [cursor, exId])

  // Reset the dialed reps/weight at the start of every set.
  useEffect(() => {
    setReps(null)
    setWeight(null)
  }, [cursor, exId, setIdx])

  // Rest countdown ticker.
  useEffect(() => {
    if (restEndsAt == null) return
    const id = setInterval(() => {
      setTick((t) => t + 1)
      if (Date.now() >= restEndsAt) clearInterval(id)
    }, 250)
    return () => clearInterval(id)
  }, [restEndsAt])

  if (!a) return null

  const item = a.plan[a.cursor]
  const ex = EXERCISES[item.exerciseId]
  const info = getCoaching(item.exerciseId)
  const tOpts = state.settings.custom
    ? { sets: state.settings.sets, reps: state.settings.reps }
    : undefined
  const t = targetParts(item.exerciseId, state.progress, state.profile, tOpts)

  const repMax = t ? Math.max((t.reps || 1) + 10, 20) : 20
  // Pre-fill reps with the target so a tap on "Complete set" logs the planned
  // work; the lifter only dials when they did more or fewer.
  const repsVal = reps == null ? (t ? t.reps : 0) : reps
  const weightVal = weight == null ? (t && t.weight != null ? t.weight : 0) : weight
  // Upper bound for the weight roller. With a suggestion we bracket around it;
  // with none (first time on a lift) we open a sensible range so the lifter can
  // dial in a working weight and bootstrap progression.
  const weightMax =
    t && t.weight != null
      ? Math.max(t.weight * 2, t.weight + 40, 40)
      : ex && ex.type === 'compound'
        ? units === 'lb'
          ? 405
          : 180
        : units === 'lb'
          ? 225
          : 100
  const total = a.plan.length
  const isLastExercise = a.cursor === total - 1
  const totalSets = t ? t.sets : (ex?.sets ?? 1)
  const isLastSet = setIdx >= totalSets - 1
  const restTotal = ex ? restSeconds(ex, state.profile) : 0
  const restLeft =
    restEndsAt != null ? Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000)) : 0
  const resting = restLeft > 0
  const restPct = restTotal > 0 ? (restLeft / restTotal) * 100 : 0
  // Rest ring geometry (r=44 matches the SVG below). The dial opens in a 40°
  // notch at 12 o'clock where the REST label is engraved (a real break in the
  // scale, speedometer-style), so track and arc sweep 320° between the notch
  // edges — rotate(20°) on both starts them at the notch's right edge. The arc
  // shrinks as the countdown runs; the layer is hidden when not resting so the
  // empty state (offset = full sweep) is never seen.
  const REST_R = 44
  const restC = 2 * Math.PI * REST_R
  const restArcLen = restC * (320 / 360)
  const restArcOffset = restArcLen * (1 - restPct / 100)
  const doneLabel = !isLastSet
    ? 'Complete set'
    : isLastExercise
      ? 'Finish workout'
      : 'Finish exercise'

  // Log the exercise: dialed reps (or the target), and the dialed weight unless
  // it's a bodyweight move or left at zero.
  function finishExercise(repsCount?: number) {
    const r = repsCount != null ? repsCount : repsVal > 0 ? repsVal : t?.reps
    const w = t && !t.bodyweight && weightVal > 0 ? weightVal : undefined
    mark('done', r, w)
    if (isLastExercise) onComplete()
  }
  // The real advance — mid-exercise: next set + start rest; last set: log it.
  function advanceNow(repsCount?: number) {
    if (ex && !isLastSet) {
      advanceSet(Date.now() + restSeconds(ex, state.profile) * 1000)
      return
    }
    finishExercise(repsCount)
  }
  function clearPending() {
    if (pendingRef.current != null) {
      window.clearTimeout(pendingRef.current)
      pendingRef.current = null
    }
  }
  function skip() {
    clearPending()
    mark('skip')
    if (isLastExercise) onComplete()
  }
  // Completing a set plays a morph confirmation — the check draws itself in,
  // then condenses and drifts up into the set counter. It's interruptible (a second tap
  // jumps straight through), skipped under Reduce Motion, and skipped on the very
  // last set — the Complete screen is already that celebration (peak-end rule).
  function completeSet(repsCount?: number) {
    if (pendingRef.current != null) {
      clearPending()
      advanceNow(repsCount)
      return
    }
    if ((isLastSet && isLastExercise) || prefersReducedMotion()) {
      advanceNow(repsCount)
      return
    }
    setPop((n) => n + 1)
    pendingRef.current = window.setTimeout(() => {
      pendingRef.current = null
      advanceNow(repsCount)
    }, POP_MS)
  }
  function quit() {
    abandon()
    onQuit()
  }
  function closeDetails() {
    setDetailsOpen(false)
    requestAnimationFrame(() =>
      detailsBtnRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    )
  }
  // One-tap swap, no picker: the slot's original plus its ranked alternatives
  // (closest first, doable with the user's kit, never a movement already in
  // today's session) form a ring, and each tap steps to the next lift in it —
  // so the first tap lands on the closest match and repeated taps cycle back
  // to the original. Swaps are for today only; nothing is remembered.
  const slot = item.from && EXERCISES[item.from] ? item.from : item.exerciseId
  const equipment = state.profile?.equipment ?? 'full'
  const swapRing = [
    ...(canDo(slot, equipment) ? [slot] : []),
    ...alternativesFor(slot, equipment, {
      exclude: sameMovements(
        a.plan.filter((_, i) => i !== a.cursor).map((p) => p.exerciseId)
      )
    })
  ]
  if (!swapRing.includes(item.exerciseId)) swapRing.unshift(item.exerciseId)
  const nextSwap =
    swapRing.length > 1
      ? swapRing[(swapRing.indexOf(item.exerciseId) + 1) % swapRing.length]
      : null
  function swapNow() {
    if (!nextSwap) return
    clearPending()
    swapExercise(nextSwap, false)
  }
  const fromEx = item.from ? EXERCISES[item.from] : undefined
  const sessNote = item.note ?? (fromEx ? `Instead of ${fromEx.name}` : null)

  const setLine = `Set ${setIdx + 1} of ${totalSets}`
  const loadLine = !t
    ? null
    : t.isTime
      ? `${repsVal}s hold`
      : t.bodyweight
        ? `× ${t.reps}`
        : weightVal > 0
          ? `${weightVal} ${t.units} × ${t.reps}`
          : `${t.reps} reps`

  return (
    <div className="frame push">
      <div className="session-head">
        <button className="icon-btn" onClick={quit} aria-label="Quit workout">
          <XIcon />
        </button>
      </div>

      <div className="body">
        {/* Focus 1 — what you're doing. The load line opens the dials. */}
        <div className="sess-top" key={`top-${a.cursor}-${item.exerciseId}`}>
          <h1 className="h1">{ex?.name}</h1>
          <button
            className="sess-sub"
            onClick={() => setDetailsOpen(true)}
            aria-label={`${resting ? 'Resting' : setLine}. Adjust weight and reps`}
          >
            {resting ? (
              <>Rest · next is {setLine.toLowerCase()}</>
            ) : (
              <>
                {setLine}
                {loadLine && (
                  <>
                    {' · '}
                    <b>{loadLine}</b>
                  </>
                )}
              </>
            )}
          </button>
        </div>

        {/* Focus 2 — the looping photo demo, or the rest dial while resting.
            Both stay mounted in one grid cell and cross-dissolve. */}
        <div className={`swap-stage sess-stage${resting ? ' resting' : ''}`}>
          <div className="swap-layer target-layer" aria-hidden={resting}>
            <div className="sess-demo">
              <ExerciseDemo exerciseId={item.exerciseId} label={ex?.name} clipOnly />
              {nextSwap && (
                <button
                  className="demo-swap"
                  onClick={swapNow}
                  aria-label={`Swap to ${EXERCISES[nextSwap]?.name ?? 'another exercise'}`}
                  tabIndex={resting ? -1 : 0}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5" />
                  </svg>
                  Swap
                </button>
              )}
            </div>
          </div>

          <div className="swap-layer rest-layer" aria-hidden={!resting}>
            <div className={`rest-panel${resting && restLeft <= 5 ? ' closing' : ''}`}>
              <div className="rest-ring">
                <svg viewBox="0 0 100 100">
                  <circle
                    className="rt-track"
                    cx="50"
                    cy="50"
                    r={REST_R}
                    fill="none"
                    strokeWidth="7"
                    strokeDasharray={`${restArcLen} ${restC}`}
                    transform="rotate(20 50 50)"
                  />
                  {/* chronograph tick track — 60 hairline marks (C(r=36)/60 ≈ 3.77) */}
                  <circle
                    className="rt-ticks"
                    cx="50"
                    cy="50"
                    r={36}
                    fill="none"
                    strokeWidth="2.5"
                    strokeDasharray="1.1 2.67"
                  />
                  <circle
                    className="rt-arc"
                    cx="50"
                    cy="50"
                    r={REST_R}
                    fill="none"
                    strokeWidth="7"
                    strokeDasharray={`${restArcLen} ${restC}`}
                    strokeDashoffset={restArcOffset}
                    transform="rotate(20 50 50)"
                  />
                </svg>
                <span className="rest-eyebrow">Rest</span>
                <div className="rest-center">
                  <div className="rest-time" role="timer" aria-label={mmss(restLeft)}>
                    <DigitRoll d={Math.floor(restLeft / 60) % 10} />
                    <span className="rt-colon">:</span>
                    <DigitRoll d={Math.floor((restLeft % 60) / 10)} />
                    <DigitRoll d={restLeft % 10} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="spacer" />

        {/* Focus 3 — the one action. Details sits quietly above it. */}
        <div className="actions">
          <div className="details-row" ref={detailsBtnRef}>
            <DetailsButton onClick={() => setDetailsOpen(true)} />
          </div>
          {/* One persistent CTA whose label cross-fades between roles, so the
              button keeps its press feel across the set <-> rest transition. */}
          <button
            className="btn primary"
            onClick={() => (resting ? setRest(null) : completeSet())}
          >
            <span className="btn-swap" key={resting ? 'skip' : 'done'}>
              {resting ? 'Skip rest' : doneLabel}
            </span>
          </button>
        </div>
      </div>

      {detailsOpen && (
        <DetailsSheet title={`${ex?.name ?? 'Exercise'} details`} onClose={closeDetails}>
          {t && (t.isTime || !t.bodyweight) && (
            <div className="target-stats details-dials" role="group" aria-label="This set">
              {t.isTime && (
                <ValueRoller
                  label="Hold"
                  value={repsVal}
                  min={0}
                  max={repMax}
                  step={1}
                  suffix="sec"
                  onChange={setReps}
                />
              )}
              {t.isTime && !t.bodyweight && <div className="tstat-div" aria-hidden="true" />}
              {!t.bodyweight && (
                <ValueRoller
                  label="Weight"
                  value={weightVal}
                  min={0}
                  max={weightMax}
                  step={weightIncrement(units)}
                  suffix={t.units}
                  onChange={setWeight}
                />
              )}
            </div>
          )}
          <div className="detail-list">
            <DetailRow label="Exercise" value={`${a.cursor + 1} of ${total}`} />
            <DetailRow label="Day" value={a.dayLabel} />
            {sessNote && <DetailRow label="Note" value={sessNote} />}
          </div>
          <div className="details-links">
            {info && (
              <button className="btn ghost" onClick={() => onShowHow(item.exerciseId)}>
                How to
              </button>
            )}
            <button className="btn ghost" onClick={skip}>
              Skip
            </button>
          </div>
        </DetailsSheet>
      )}

      {pop > 0 && (
        <div className="set-pop" key={pop} aria-hidden="true">
          <span className="set-pop-badge">
            <CheckIcon />
          </span>
        </div>
      )}
    </div>
  )
}
