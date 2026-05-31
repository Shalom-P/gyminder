import { useStore } from '../state/store'
import { EXERCISES } from '../data/exercises'
import { getActiveSplit } from '../data/splits'
import { buildPlan } from '../engine/progression'
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
  if (!split || !state.profile) return null

  const day = upcomingDay(state)
  const ready = nextReadyInfo(state)
  const now = Date.now()
  const isReady = !ready || ready.ready

  // Ring fills as recovery progresses toward the recommended next session.
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

  // Session preview — count, sets and a rough time estimate for the next day.
  const items = day ? buildPlan(day, state.profile, state.progress).items : []
  const exCount = items.length
  const setCount = items.reduce((t, it) => {
    const ex = EXERCISES[it.exerciseId]
    return t + (ex?.sets ?? 3)
  }, 0)
  const estSecs = items.reduce((t, it) => {
    const ex = EXERCISES[it.exerciseId]
    if (!ex) return t
    const sets = ex.sets || 3
    const rest = ex.type === 'compound' ? 180 : ex.type === 'accessory' ? 120 : 90
    return t + sets * (40 + rest)
  }, 0)
  const estMin = Math.max(20, Math.round(estSecs / 60 / 5) * 5)

  const rel = relativeTime(state.lastWorkoutAt, now)
  const headline = isReady ? 'You’re good to go' : 'Still recovering'

  return (
    <div className="frame tabbed">
      <div className="top">
        <span className="brand">
          <BrandMark />
          Gyminder
        </span>
        <span className={`pill${isReady ? ' ok' : ''}`}>
          <span className="dot" />
          {isReady ? 'Ready to train' : 'Recovering'}
        </span>
      </div>

      <div className="body">
        <div className="home-head">
          <span className="eyebrow">{greeting()}</span>
          <h1 className="h1">{headline}</h1>
          <p className="muted">
            {split.name} &middot; last trained {rel.toLowerCase()}
          </p>
        </div>

        <div className="hero">
          <div className={`ring-wrap${isReady ? ' charged' : ''}`}>
            <svg viewBox="0 0 100 100">
              <defs>
                <linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--accent-2)" />
                </linearGradient>
                <linearGradient id="ringgradok" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--accent-2)" />
                  <stop offset="100%" stopColor="var(--accent)" />
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
                className={`ring-arc${isReady ? ' charged' : ''}`}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeWidth="9"
                strokeDasharray={C}
                strokeDashoffset={offset}
              />
            </svg>
            <div className="ring-center">
              <span className="ring-label">Next session</span>
              <span className="ring-big">{day?.label}</span>
              <span className="ring-sub">
                {isReady
                  ? 'Recovered'
                  : `Ready in ${formatIn(ready.readyAt - now)}`}
              </span>
            </div>
          </div>

          <div className="home-meta">
            <div className="hm-item">
              <b>{exCount}</b>
              <span>exercises</span>
            </div>
            <span className="hm-sep" />
            <div className="hm-item">
              <b>{setCount}</b>
              <span>sets</span>
            </div>
            <span className="hm-sep" />
            <div className="hm-item">
              <b>{estMin}</b>
              <span>minutes</span>
            </div>
          </div>
        </div>

        <div className="actions">
          <button className={`btn primary${isReady ? ' ok' : ''}`} onClick={go}>
            Start {day?.label}
          </button>
          <button className="btn ghost" onClick={onPick}>
            Choose another day
          </button>
        </div>
      </div>
    </div>
  )
}
