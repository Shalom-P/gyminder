import { EXERCISES } from '../data/exercises'
import { PATTERNS, getCoaching } from '../data/coaching'
import { describeTarget } from '../engine/progression'
import { useStore } from '../state/store'

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function ExerciseDetail({
  exerciseId,
  onBack
}: {
  exerciseId: string
  onBack: () => void
}) {
  const { state } = useStore()
  const ex = EXERCISES[exerciseId]
  const info = getCoaching(exerciseId)
  if (!ex || !info) return null
  const p = PATTERNS[info.pattern]
  const muscles = [cap(ex.primary), ...info.secondary]

  return (
    <div className="frame">
      <div className="top">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ✕
        </button>
        <span className="brand">How to do it</span>
      </div>

      <div className="body scroll">
        <h1 className="h1">{ex.name}</h1>
        <p className="muted">{info.summary}</p>

        <div className="tags">
          <span className="pill">{info.difficulty}</span>
          <span className="pill">{ex.type}</span>
          <span className="pill">
            {describeTarget(
              exerciseId,
              state.progress,
              state.profile?.units ?? 'kg'
            )}
          </span>
        </div>

        <div className="section">
          <h3>Muscles worked</h3>
          <div className="tags">
            {muscles.map((m) => (
              <span key={m} className="pill">
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>Equipment</h3>
          <p className="muted">{info.equipmentNote}</p>
        </div>

        <div className="section">
          <h3>Set up</h3>
          <ul>
            {info.setup.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="section">
          <h3>How to perform</h3>
          <ul>
            {p.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="section">
          <h3>Form cues</h3>
          <ul>
            {p.cues.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="section">
          <h3>Common mistakes</h3>
          <ul>
            {p.mistakes.map((s, i) => (
              <li key={i} className="bad">
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="section">
          <h3>Tempo &amp; breathing</h3>
          <p className="muted">
            <strong>Tempo:</strong> {p.tempo}
            <br />
            <strong>Breathing:</strong> {p.breathing}
          </p>
        </div>
      </div>
    </div>
  )
}
