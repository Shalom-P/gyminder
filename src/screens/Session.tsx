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
  const { state, mark, abandon } = useStore()
  const [reps, setReps] = useState<number | null>(null)
  const [weight, setWeight] = useState<number | null>(null)
  const [showDemo, setShowDemo] = useState(false)
  const [setIdx, setSetIdx] = useState(0)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)
  const [, setTick] = useState(0)

  const a = state.active
  const units = state.profile?.units ?? 'kg'
  const cursor = a?.cursor ?? -1

  // Reset per-exercise UI when the workout advances to the next exercise.
  useEffect(() => {
    setSetIdx(0)
    setRestEndsAt(null)
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
  const repsVal = reps == null ? (t && t.isTime ? t.reps : 0) : reps
  const weightVal = weight == null ? (t && t.weight != null ? t.weight : 0) : weight
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
    ? 'Done with hold'
    : isLastExercise
      ? 'Finish workout'
      : 'Finish exercise'

  // Log the exercise: dialed reps (or the target), and weight unless bodyweight.
  function finishExercise(repsCount?: number) {
    setRestEndsAt(null)
    const r = repsCount != null ? repsCount : repsVal > 0 ? repsVal : t?.reps
    const w = t && !t.bodyweight && t.weight != null ? weightVal : undefined
    mark('done', r, w)
    if (isLastExercise) onComplete()
  }
  function skip() {
    setRestEndsAt(null)
    mark('skip')
    if (isLastExercise) onComplete()
  }
  // Mid-exercise: advance to the next set + start rest. Last set: log it.
  function completeSet(repsCount?: number) {
    if (ex && !isLastSet) {
      setSetIdx(setIdx + 1)
      setRestEndsAt(Date.now() + restSeconds(ex) * 1000)
      return
    }
    finishExercise(repsCount)
  }
  // Each tap counts one rep up the wheel; hitting the target completes the set.
  function addRep() {
    const nv = Math.min(repMax, (repsVal || 0) + 1)
    setReps(nv)
    if (t && !t.isTime && nv >= (t.reps || 1)) completeSet(nv)
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
                <div className="tstat-div" aria-hidden="true" />
                <ValueRoller
                  label={t.isTime ? 'Hold' : 'Reps'}
                  value={repsVal}
                  min={0}
                  max={repMax}
                  step={1}
                  suffix={t.isTime ? 'sec' : `of ${t.reps}`}
                  onChange={setReps}
                />
                <div className="tstat-div" aria-hidden="true" />
                {t.bodyweight ? (
                  <div className="tstat">
                    <span className="tstat-lbl">Weight</span>
                    <div className="roller-static">
                      <span className="tstat-bw">Body</span>
                    </div>
                    <span className="roller-total">&nbsp;</span>
                  </div>
                ) : t.weight != null ? (
                  <ValueRoller
                    label="Weight"
                    value={weightVal}
                    min={0}
                    max={Math.max((t.weight || 0) * 2, (t.weight || 0) + 40, 40)}
                    step={units === 'lb' ? 5 : 2.5}
                    suffix={t.units}
                    onChange={setWeight}
                  />
                ) : (
                  <div className="tstat">
                    <span className="tstat-lbl">Weight</span>
                    <div className="roller-static">
                      <span className="tstat-bw">—</span>
                    </div>
                    <span className="roller-total">&nbsp;</span>
                  </div>
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
            <button className="btn primary" onClick={() => setRestEndsAt(null)}>
              Skip rest
            </button>
          ) : t && t.isTime ? (
            <button className="btn primary" onClick={() => completeSet()}>
              {doneLabel}
            </button>
          ) : (
            <button className="btn primary" onClick={addRep}>
              Done with rep
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
