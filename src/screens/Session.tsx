import { useEffect, useState } from 'react'
import { useStore } from '../state/store'
import { EXERCISES } from '../data/exercises'
import { getCoaching } from '../data/coaching'
import { restSeconds, targetParts } from '../engine/progression'
import { SetRoller, ValueRoller } from '../components/Rollers'
import ExerciseDemo from '../components/ExerciseDemo'

function mmss(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

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
  function skip() {
    mark('skip')
    if (isLastExercise) onComplete()
  }
  // Mid-exercise: advance to the next set + start rest. Last set: log it.
  function completeSet(repsCount?: number) {
    if (ex && !isLastSet) {
      advanceSet(Date.now() + restSeconds(ex) * 1000)
      return
    }
    finishExercise(repsCount)
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
        <div className="sess-top">
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

        {resting ? (
          <div className="rest-panel" aria-live="polite">
            <span className="rest-eyebrow">Rest</span>
            <div className="rest-time">{mmss(restLeft)}</div>
            <div className="rest-bar">
              <div className="rest-bar-fill" style={{ width: `${restPct}%` }} />
            </div>
            <span className="rest-next">
              Up next · Set {setIdx + 1} of {totalSets}
            </span>
          </div>
        ) : (
          <div className="target-card" aria-live="polite">
            {t && (
              <div className="target-stats" role="group">
                <SetRoller current={setIdx + 1} total={t.sets} />
                {/* Timed holds keep a duration wheel; rep work no longer shows a
                    rep counter — "Complete set" logs the programmed target. */}
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
        )}

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
          {resting ? (
            <button className="btn primary" onClick={() => setRest(null)}>
              Skip rest
            </button>
          ) : (
            <button className="btn primary" onClick={() => completeSet()}>
              {doneLabel}
            </button>
          )}
          <button className="btn ghost" onClick={skip}>
            Skip exercise
          </button>
        </div>
      </div>
    </div>
  )
}
