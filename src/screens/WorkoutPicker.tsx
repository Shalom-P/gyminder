import { useStore } from '../state/store'
import { getActiveSplit } from '../data/splits'
import { listDayInfo, recommendedDayId, formatIn } from '../engine/schedule'

export default function WorkoutPicker({
  onBack,
  onStarted
}: {
  onBack: () => void
  onStarted: () => void
}) {
  const { state, startDay } = useStore()
  const split = getActiveSplit(state)
  if (!split) return null

  const now = Date.now()
  const infos = listDayInfo(state, now)
  const recoId = recommendedDayId(state, now)

  function pick(dayId: string) {
    startDay(dayId)
    onStarted()
  }

  return (
    <div className="frame">
      <div className="top">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ✕
        </button>
        <span className="brand">Choose workout</span>
      </div>

      <div className="body scroll">
        <p className="muted">
          {split.name} · pick any day. Targets adjust to your past workouts;
          timing reflects recovery.
        </p>
        <div className="list">
          {infos.map((d) => (
            <button
              key={d.dayId}
              className={`choice${d.dayId === recoId ? ' reco' : ''}`}
              onClick={() => pick(d.dayId)}
            >
              {d.dayId === recoId && (
                <span className="badge">Suggested</span>
              )}
              <span className="title">{d.label}</span>
              <span className="muted">{d.detail}</span>
              <span
                className={`pill${d.ready ? ' ok' : ''}`}
                style={{ marginTop: 8 }}
              >
                <span className="dot" />
                {d.ready ? 'Ready now' : `Best in ${formatIn(d.readyAt - now)}`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
