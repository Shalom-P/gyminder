import { useStore } from '../state/store'
import { formatIn, nextReadyInfo } from '../engine/schedule'
import { CheckIcon } from '../components/icons'

export default function Complete({ onHome }: { onHome: () => void }) {
  const { state } = useStore()
  const last = state.history[state.history.length - 1]
  const done = last ? last.entries.filter((e) => e.status === 'done').length : 0
  const total = last ? last.entries.length : 0
  const ready = nextReadyInfo(state)
  const now = Date.now()

  return (
    <div className="frame">
      <div className="top">
        <span className="brand">Workout complete</span>
        <span />
      </div>

      <div className="body">
        <div className="hero">
          <div className="success">
            <CheckIcon />
          </div>
          <h1 className="h1" style={{ marginTop: 18, textAlign: 'center' }}>
            {last?.dayLabel} done
          </h1>
          <p className="muted" style={{ textAlign: 'center' }}>
            <span className="big-num" style={{ fontSize: 30 }}>
              {done}/{total}
            </span>
            <br />
            exercises completed · logged just now
          </p>
        </div>

        {ready && (
          <div className="card">
            <span className="label">Suggested next</span>
            <h2 className="h2">{ready.dayLabel}</h2>
            <span className={`pill${ready.ready ? ' ok' : ''}`}>
              <span className="dot" />
              {ready.ready
                ? 'Ready now'
                : `Recommended in ${formatIn(ready.readyAt - now)}`}
            </span>
            <span className="muted">{ready.detail}</span>
          </div>
        )}

        <div className="actions">
          <button className="btn primary" onClick={onHome}>
            Back home
          </button>
        </div>
      </div>
    </div>
  )
}
