import { useStore } from '../state/store'
import { getActiveSplit } from '../data/splits'

function Stepper({
  value,
  min,
  max,
  onChange
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="stepper">
      <button
        className="step-btn"
        disabled={value <= min}
        aria-label="Decrease"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </button>
      <span className="step-val">{value}</span>
      <button
        className="step-btn"
        disabled={value >= max}
        aria-label="Increase"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
      </button>
    </div>
  )
}

export default function Settings({
  onChangeMode
}: {
  onChangeMode: () => void
}) {
  const { state, resetAll, redoSetup, setTargets, setTheme } = useStore()
  const split = getActiveSplit(state)
  const p = state.profile
  const set = state.settings

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
          <span className="label">Mode</span>
          <h2 className="h2">{split?.name ?? '—'}</h2>
        </div>

        <div className="card">
          <span className="label">Targets</span>
          <div className="seg2">
            <button
              className={!set.custom ? 'on' : ''}
              onClick={() => setTargets({ custom: false })}
            >
              Auto
            </button>
            <button
              className={set.custom ? 'on' : ''}
              onClick={() => setTargets({ custom: true })}
            >
              Custom
            </button>
          </div>
          {set.custom && (
            <>
              <div className="set-row">
                <span className="k">Sets</span>
                <Stepper
                  value={set.sets}
                  min={1}
                  max={6}
                  onChange={(v) => setTargets({ sets: v })}
                />
              </div>
              <div className="set-row">
                <span className="k">Reps</span>
                <Stepper
                  value={set.reps}
                  min={1}
                  max={20}
                  onChange={(v) => setTargets({ reps: v })}
                />
              </div>
            </>
          )}
        </div>

        <div className="card">
          <span className="label">Appearance</span>
          <div className="seg2">
            <button
              className={state.theme === 'dark' ? 'on' : ''}
              onClick={() => setTheme('dark')}
            >
              Dark
            </button>
            <button
              className={state.theme === 'light' ? 'on' : ''}
              onClick={() => setTheme('light')}
            >
              Light
            </button>
          </div>
        </div>

        <div className="card">
          <span className="label">Profile</span>
          <span className="muted" style={{ textTransform: 'capitalize' }}>
            {p
              ? `${p.experience} · ${p.goal} · ${p.equipment} · ${p.units ?? 'kg'}`
              : '—'}
          </span>
        </div>

        <div className="spacer" />

        <div className="actions">
          <button className="btn primary" onClick={onChangeMode}>
            Change mode
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
