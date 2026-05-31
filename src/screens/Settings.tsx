import { useStore } from '../state/store'
import { getActiveSplit } from '../data/splits'

export default function Settings({
  onChangeMode
}: {
  onChangeMode: () => void
}) {
  const { state, resetAll, redoSetup } = useStore()
  const split = getActiveSplit(state)
  const p = state.profile

  return (
    <div className="frame tabbed">
      <div className="top">
        <span className="brand">Settings</span>
        <span />
      </div>

      <div className="body scroll">
        <h1 className="h1" style={{ marginBottom: 4 }}>
          Settings
        </h1>

        <div className="card">
          <span className="muted">Current mode</span>
          <h2 className="h2">{split?.name ?? '—'}</h2>
          <span className="muted">
            {state.history.length} workouts logged
          </span>
        </div>

        <div className="card">
          <span className="label">Your profile</span>
          <span className="muted" style={{ textTransform: 'capitalize' }}>
            {p
              ? `${p.experience} · ${p.goal} · ${p.daysPerWeek} days · ${p.equipment} · ${p.units ?? 'kg'}`
              : '—'}
          </span>
        </div>

        <div className="spacer" />

        <div className="actions">
          <button className="btn primary" onClick={onChangeMode}>
            Change training mode
          </button>
          <button
            className="btn"
            onClick={() => {
              if (confirm('Redo the setup questions? Your workout history is kept.'))
                redoSetup()
            }}
          >
            Redo setup
          </button>
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Erase ALL data — profile, history and progress?'))
                resetAll()
            }}
          >
            Reset all data
          </button>
        </div>
      </div>
    </div>
  )
}
