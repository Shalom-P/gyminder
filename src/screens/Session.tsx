import { useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'
import { EXERCISES } from '../data/exercises'
import { getCoaching } from '../data/coaching'
import { restSeconds, targetParts } from '../engine/progression'
import { SetRoller, ValueRoller } from '../components/Rollers'
import ExerciseDemo from '../components/ExerciseDemo'
import { CheckIcon } from '../components/icons'

function mmss(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

// How long the completion checkmark plays before the next state takes over.
// Kept brief (Apple HIG: quick + purposeful for frequent interactions).
const POP_MS = 360
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
  const { state, mark, abandon, advanceSet, setRest } = useStore()
  const [reps, setReps] = useState<number | null>(null)
  const [weight, setWeight] = useState<number | null>(null)
  const [showDemo, setShowDemo] = useState(false)
  const [, setTick] = useState(0)
  // Completion-beat state: `pop` increments to replay the checkmark; `pendingRef`
  // holds the timer that fires the actual advance once the beat has played.
  const [pop, setPop] = useState(0)
  const pendingRef = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (pendingRef.current != null) window.clearTimeout(pendingRef.current)
    },
    []
  )

  const a = state.active
  const units = state.profile?.units ?? 'kg'
  const cursor = a?.cursor ?? -1
  // Set position and rest timer live in the store so they survive a trip to the
  // How-to screen (which unmounts this component) and even an app reload.
  const setIdx = a?.setIdx ?? 0
  const restEndsAt = a?.restEndsAt ?? null

  // Collapse the inline demo when the workout advances to the next exercise.
  useEffect(() => {
    setShowDemo(false)
  }, [cursor])

  // Reset the dialed reps/weight at the start of every set.
  useEffect(() => {
    setReps(null)
    setWeight(null)
  }, [cursor, setIdx])

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
  const t = targetParts(item.exerciseId, state.progress, units, tOpts)

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
  const restTotal = ex ? restSeconds(ex) : 0
  const restLeft =
    restEndsAt != null ? Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000)) : 0
  const resting = restLeft > 0
  const restPct = restTotal > 0 ? (restLeft / restTotal) * 100 : 0
  // Rest ring geometry (r=44 matches the SVG below). The arc shrinks as the
  // countdown runs; the layer is hidden when not resting so the empty state
  // (offset = full circumference) is never seen.
  const REST_R = 44
  const restC = 2 * Math.PI * REST_R
  const restArcOffset = restC * (1 - restPct / 100)
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
      advanceSet(Date.now() + restSeconds(ex) * 1000)
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
  // Completing a set plays a brief Apple-style confirmation, then advances to the
  // next state (rest timer / next exercise). It's interruptible (a second tap
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

  return (
    <div className="frame push">
      <div className="session-head">
        <button className="icon-btn" onClick={quit} aria-label="Quit workout">
          ✕
        </button>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(a.cursor / total) * 100}%` }} />
        </div>
        <span className="chip">
          {a.cursor + 1} / {total}
        </span>
      </div>

      <div className="body">
        <div className="sess-top" key={`top-${a.cursor}`}>
          <span className="eyebrow">{a.dayLabel}</span>
          <h1 className="h1">{ex?.name}</h1>
          <div
            className="set-track"
            role="img"
            aria-label={`Set ${setIdx + 1} of ${totalSets}`}
          >
            {Array.from({ length: totalSets }).map((_, i) => (
              <span
                key={i}
                className={`seg ${i < setIdx ? 'done' : i === setIdx ? 'cur' : 'todo'}`}
              />
            ))}
          </div>
        </div>

        {/* Rollers and the rest ring share one stacked grid cell and cross-
            dissolve as `resting` toggles — stable height, no layout jump. */}
        <div className={`swap-stage${resting ? ' resting' : ''}`}>
          <div className="swap-layer target-layer" aria-hidden={resting}>
            <div className="target-card">
              {t && (
                <div className="target-stats" role="group">
                  <SetRoller current={setIdx + 1} total={t.sets} />
                  {/* Timed holds keep a duration wheel; rep work no longer shows
                      a rep counter — "Complete set" logs the programmed target. */}
                  {t.isTime && (
                    <>
                      <div className="tstat-div" aria-hidden="true" />
                      <ValueRoller
                        label="Hold"
                        value={repsVal}
                        min={0}
                        max={repMax}
                        step={1}
                        suffix="sec"
                        onChange={setReps}
                      />
                    </>
                  )}
                  <div className="tstat-div" aria-hidden="true" />
                  {t.bodyweight ? (
                    <div className="tstat">
                      <span className="tstat-lbl">Weight</span>
                      <div className="roller-static">
                        <span className="tstat-bw">Body</span>
                      </div>
                      <span className="roller-total">&nbsp;</span>
                    </div>
                  ) : (
                    <ValueRoller
                      label="Weight"
                      value={weightVal}
                      min={0}
                      max={weightMax}
                      step={units === 'lb' ? 5 : 2.5}
                      suffix={t.units}
                      onChange={setWeight}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="swap-layer rest-layer" aria-hidden={!resting}>
            <div className="rest-panel">
              <div className="rest-ring">
                <svg viewBox="0 0 100 100">
                  <circle
                    className="rt-track"
                    cx="50"
                    cy="50"
                    r={REST_R}
                    fill="none"
                    strokeWidth="7"
                  />
                  <circle
                    className="rt-arc"
                    cx="50"
                    cy="50"
                    r={REST_R}
                    fill="none"
                    strokeWidth="7"
                    strokeDasharray={restC}
                    strokeDashoffset={restArcOffset}
                  />
                </svg>
                <div className="rest-center">
                  <span className="rest-eyebrow">Rest</span>
                  <div className="rest-time">{mmss(restLeft)}</div>
                </div>
              </div>
              <span className="rest-next">
                Up next · Set {setIdx + 1} of {totalSets}
              </span>
            </div>
          </div>
        </div>

        {showDemo && (
          <div className="demo-reveal">
            <ExerciseDemo exerciseId={item.exerciseId} label={ex?.name} clipOnly />
          </div>
        )}

        <div className="sess-links">
          <button className="btn ghost" onClick={() => setShowDemo(!showDemo)}>
            {showDemo ? 'Hide' : 'Demo'}
          </button>
          {info && (
            <button className="btn ghost" onClick={() => onShowHow(item.exerciseId)}>
              How to
            </button>
          )}
        </div>

        <div className="spacer" />

        <div className="actions">
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
          <button className="btn ghost" onClick={skip}>
            Skip exercise
          </button>
        </div>
      </div>

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
