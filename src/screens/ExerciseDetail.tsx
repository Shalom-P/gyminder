import { EXERCISES } from '../data/exercises'
import { effortCue, getCoaching, getTechnique } from '../data/coaching'
import { targetParts } from '../engine/progression'
import { alternativesFor } from '../engine/alternatives'
import { useStore } from '../state/store'
import ExerciseDemo from '../components/ExerciseDemo'
import { ChevronIcon, XIcon } from '../components/icons'

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function ExerciseDetail({
  exerciseId,
  onBack,
  onOpen
}: {
  exerciseId: string
  onBack: () => void
  /** Open another exercise's how-to (from the Alternatives list). */
  onOpen: (exerciseId: string) => void
}) {
  const { state } = useStore()
  const ex = EXERCISES[exerciseId]
  const info = getCoaching(exerciseId)
  const p = getTechnique(exerciseId)
  if (!ex || !info || !p) return null
  const muscles = [cap(ex.primary), ...info.secondary]
  const tOpts = state.settings.custom
    ? { sets: state.settings.sets, reps: state.settings.reps }
    : undefined
  const t = targetParts(exerciseId, state.progress, state.profile, tOpts)
  // What to do instead without this exercise's kit — doable with the user's
  // equipment. (Swapping itself happens in the session, via Swap.)
  const alts = alternativesFor(exerciseId, state.profile?.equipment ?? 'full', {
    limit: 4
  })

  return (
    <div className="frame push">
      <div className="top">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <XIcon />
        </button>
        <span className="brand center">How to do it</span>
      </div>

      <div className="body scroll">
        <div className="screen-head">
          <h1 className="h1">{ex.name}</h1>
          <p className="muted">{info.summary}</p>
        </div>

        <ExerciseDemo exerciseId={exerciseId} label={ex.name} clipOnly />

        <div className="tags">
          <span className="pill">{info.difficulty}</span>
          <span className="pill">{ex.type}</span>
          {t && (
            <>
              <span className="pill">{t.sets} sets</span>
              <span className="pill">
                {t.reps}
                {t.isTime ? 's hold' : ' reps'}
              </span>
              {t.bodyweight ? (
                <span className="pill">Bodyweight</span>
              ) : t.weight != null ? (
                <span className="pill">
                  {t.weight} {t.units}
                </span>
              ) : null}
            </>
          )}
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

        {alts.length > 0 && (
          <div className="section">
            <h3>Alternatives</h3>
            <div className="list">
              {alts.map((id) => (
                <button key={id} className="row-link" onClick={() => onOpen(id)}>
                  <span>
                    {EXERCISES[id].name}
                    <span className="sub">{EXERCISES[id].kit}</span>
                  </span>
                  <span className="chev">
                    <ChevronIcon />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

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

        <div className="section">
          <h3>Effort</h3>
          <p className="muted">{effortCue(ex, state.profile?.goal)}</p>
        </div>
      </div>
    </div>
  )
}
