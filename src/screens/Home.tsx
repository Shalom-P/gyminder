import { useStore } from '../state/store'
import { getActiveSplit } from '../data/splits'
import {
  formatIn,
  nextReadyInfo,
  relativeTime,
  upcomingDay
} from '../engine/schedule'
import { BrandMark } from '../components/icons'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Home({
  onStart,
  onPick
}: {
  onStart: () => void
  onPick: () => void
}) {
  const { state, start } = useStore()
  const split = getActiveSplit(state)
  if (!split) return null

  const day = upcomingDay(state)
  const ready = nextReadyInfo(state)
  const now = Date.now()
  const isReady = !ready || ready.ready

  let frac = 1
  if (ready && !ready.ready && state.lastWorkoutAt != null) {
    const span = ready.readyAt - state.lastWorkoutAt
    frac = span > 0 ? Math.min(1, Math.max(0, (now - state.lastWorkoutAt) / span)) : 1
  }

  const R = 44
  const C = 2 * Math.PI * R
  const offset = C * (1 - frac)

  function go() {
    start()
    onStart()
  }

  return (
    <div className="frame tabbed">
      <div className="top">
        <span className="brand">
          <BrandMark />
          Gyminder
        </span>
        <span className="pill" style={{ alignSelf: 'center' }}>
          <span className="dot" style={{ background: 'var(--accent)' }} />
          {state.history.length} logged
        </span>
      </div>

      <div className="body">
        <div>
          <span className="eyebrow">{greeting()}</span>
          <h1 className="h1">{split.name}</h1>
          <p className="muted">
            Last workout · {relativeTime(state.lastWorkoutAt, now)}
          </p>
        </div>

        <div className="hero">
          <div className="ring-wrap">
            <svg viewBox="0 0 100 100">
              <defs>
                <linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#5eead4" />
                </linearGradient>
                <linearGradient id="ringgradok" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#5eead4" />
                </linearGradient>
              </defs>
              <circle
                className="ring-track"
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeWidth="9"
              />
              <circle
                className="ring-arc"
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeWidth="9"
                strokeDasharray={C}
                strokeDashoffset={offset}
                stroke={isReady ? 'url(#ringgradok)' : 'url(#ringgrad)'}
              />
            </svg>
            <div className="ring-center">
              <span className={`ring-status${isReady ? ' ok' : ''}`}>
                {isReady ? 'Suggested' : 'Recovering'}
              </span>
              <span className="ring-big">{day?.label}</span>
              <span className="ring-sub">
                {isReady || !ready
                  ? ready?.why ?? 'Good to go'
                  : `Best in ${formatIn(ready.readyAt - now)}`}
              </span>
            </div>
          </div>
          {ready && (
            <p className="muted" style={{ textAlign: 'center' }}>
              {ready.detail}
            </p>
          )}
        </div>

        <div className="actions">
          <button
            className={`btn primary${isReady ? ' ok' : ''}`}
            onClick={go}
          >
            Start {day?.label}
          </button>
          <button className="btn ghost" onClick={onPick}>
            Choose a different workout
          </button>
          {ready && !ready.ready && (
            <span className="muted" style={{ textAlign: 'center' }}>
              Train now anyway — this is just the recovery-optimal time.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
