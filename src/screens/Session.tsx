import { useEffect, useState } from 'react'
import { useStore } from '../state/store'
import { EXERCISES } from '../data/exercises'
import { getCoaching } from '../data/coaching'
import { describeTarget, restSeconds } from '../engine/progression'
import ExerciseAnimation from '../components/ExerciseAnimation'

function mmss(sec: number) {
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
  const [showDetail, setShowDetail] = useState(false)
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [setIdx, setSetIdx] = useState(0)
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)
  const [, setTick] = useState(0)

  const a = state.active
  const units = state.profile?.units ?? 'kg'

  // Reset per-exercise UI whenever the workout advances to the next exercise.
  const cursor = a?.cursor ?? -1
  useEffect(() => {
    setShowDetail(false)
    setReps('')
    setWeight('')
    setSetIdx(0)
    setRestEndsAt(null)
  }, [cursor])

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
  const total = a.plan.length
  const isLastExercise = a.cursor === total - 1
  const totalSets = ex?.sets ?? 1
  const isLastSet = setIdx >= totalSets - 1
  const restTotal = ex ? restSeconds(ex) : 0
  const restLeft =
    restEndsAt != null
      ? Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000))
      : 0
  const resting = restLeft > 0
  const restPct = restTotal > 0 ? (restLeft / restTotal) * 100 : 0
  const doneLabel = !isLastSet
    ? `Complete set ${setIdx + 1} of ${totalSets}`
    : isLastExercise
      ? 'Finish workout'
      : 'Finish exercise'

  function record(status: 'done' | 'skip') {
    setRestEndsAt(null)
    const r = status === 'done' && reps.trim() ? Number(reps) : undefined
    const w = status === 'done' && weight.trim() ? Number(weight) : undefined
    mark(
      status,
      Number.isFinite(r) ? r : undefined,
      Number.isFinite(w) ? w : undefined
    )
    if (isLastExercise) onComplete()
  }

  // "Done" completes the current set. Mid-exercise it advances to the next
  // set and starts the rest timer; on the last set it logs the exercise.
  function done() {
    if (ex && !isLastSet) {
      setSetIdx(setIdx + 1)
      setRestEndsAt(Date.now() + restSeconds(ex) * 1000)
      return
    }
    record('done')
  }

  function quit() {
    abandon()
    onQuit()
  }

  return (
    <div className="frame">
      <div className="session-head">
        <button className="icon-btn" onClick={quit} aria-label="Quit workout">
          ✕
        </button>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${(a.cursor / total) * 100}%` }}
          />
        </div>
        <span className="chip">
          {a.cursor + 1} / {total}
        </span>
      </div>

      <div className="body">
        <div className="sess-top">
          <span className="eyebrow">{a.dayLabel}</span>
          <h1 className="h1">{ex?.name}</h1>
          <div className="set-track" role="img" aria-label={`Set ${setIdx + 1} of ${totalSets}`}>
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
            <span className="lbl">
              Set {setIdx + 1} of {totalSets}
            </span>
            <div className="big-num">
              {describeTarget(item.exerciseId, state.progress, units)}
            </div>
            {item.note && <div className="note">{item.note}</div>}
          </div>
        )}

        {info && (
          <div className="demo-stage">
            <ExerciseAnimation exerciseId={item.exerciseId} label={ex?.name} />
          </div>
        )}

        <button
          className="btn ghost"
          style={{ alignSelf: 'center', padding: 0 }}
          onClick={() => onShowHow(item.exerciseId)}
        >
          ⓘ How to do it (info)
        </button>

        {showDetail && (
          <div className="detail">
            <div className="field">
              <label htmlFor="reps">Reps done</label>
              <input
                id="reps"
                inputMode="numeric"
                pattern="[0-9]*"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="e.g. 8"
              />
            </div>
            {ex?.equipment !== 'bodyweight' && (
              <div className="field">
                <label htmlFor="weight">Weight ({units})</label>
                <input
                  id="weight"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 40"
                />
              </div>
            )}
          </div>
        )}

        {!showDetail && (
          <button className="btn ghost" onClick={() => setShowDetail(true)}>
            + Add detail (optional)
          </button>
        )}

        <div className="spacer" />

        <div className="actions">
          <button className="btn primary" onClick={done}>
            {resting ? `Skip rest · ${doneLabel}` : doneLabel}
          </button>
          <button className="btn" onClick={() => record('skip')}>
            Skip exercise
          </button>
        </div>
      </div>
    </div>
  )
}
