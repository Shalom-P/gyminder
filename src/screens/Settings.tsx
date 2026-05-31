import { useStore } from '../state/store'
import { getActiveSplit } from '../data/splits'

export default function Settings({
  onBack,
  onChangeMode,
  onLibrary
}: {
  onBack: () => void
  onChangeMode: () => void
  onLibrary: () => void
}) {
  const { state, resetAll, redoSetup } = useStore()
  const split = getActiveSplit(state)

  return (
    <div className="frame">
      <div className="top">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ✕
        </button>
        <span className="brand">Settings</span>
      </div>

      <div className="body">
        <div className="card">
          <span className="muted">Current mode</span>
          <h2 className="h2">{split?.name ?? '—'}</h2>
          <span className="muted">
            {state.history.length} workouts logged
          </span>
        </div>

        <div className="spacer" />

        <div className="actions">
          <button className="btn primary" onClick={onChangeMode}>
            Change training mode
          </button>
          <button className="btn" onClick={onLibrary}>
            Exercise library
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
