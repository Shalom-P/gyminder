import { type CSSProperties } from 'react'
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
import { CountUp } from '../components/CountUp'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// ---- Recovery "heat" ramp ---------------------------------------------------
// The recovering ring reads two ways at once: its arc LENGTH is how far recovery
// has progressed, and its HUE is how recovered the body is — coral when freshly
// trained (don't train this yet) → amber mid-recovery → emerald when nearly
// ready. This mirrors the recovery-score colour language people already know
// from wearables, so the state is legible at a glance.
type RGB = [number, number, number]
const REC_RAMP: Array<[number, RGB]> = [
  [0.0, [255, 107, 90]], // coral — depleted, just trained
  [0.5, [255, 194, 77]], // amber — recovering
  [1.0, [191, 232, 90]] // lime-green — nearly recovered, charging toward the accent
]
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const mix = (a: RGB, b: RGB, t: number): RGB => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t))
]
function recoveryHue(frac: number): RGB {
  const t = Math.min(1, Math.max(0, frac))
  for (let i = 0; i < REC_RAMP.length - 1; i++) {
    const [p0, c0] = REC_RAMP[i]
    const [p1, c1] = REC_RAMP[i + 1]
    if (t <= p1) return mix(c0, c1, (t - p0) / (p1 - p0))
  }
  return REC_RAMP[REC_RAMP.length - 1][1]
}
const css = (c: RGB, a = 1) =>
  a === 1 ? `rgb(${c[0]} ${c[1]} ${c[2]})` : `rgb(${c[0]} ${c[1]} ${c[2]} / ${a})`

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
  // The recovering tip dot rides the head of the arc — placed by rotating its
  // wrapper to where the filled arc ends (the ring SVG starts at 12 o'clock).
  const tipDeg = frac * 360

  // Everything on the recovering screen is a function of ONE value: how far the
  // ring has filled (coverage). It picks the hue, which we hand to the whole
  // frame as CSS custom properties — so the ring, pill, countdown, accent, the
  // Start button and the ambient glow all move together as recovery progresses.
  const coverage = frac
  const hue = recoveryHue(coverage)
  const palette = {
    '--rc': css(hue),
    '--rc-light': css(mix(hue, [255, 255, 255], 0.16)),
    '--rc-deep': css(mix(hue, [0, 0, 0], 0.14)),
    '--rc-ink': css(mix(hue, [0, 0, 0], 0.8)),
    '--rc-glow': css(hue, 0.5),
    '--rc-wash': css(hue, 0.14),
    '--rc-veil': css(hue, 0.22) // faint ambient tint for the header
  } as CSSProperties

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
  const headline = isReady ? 'Recovered and ready' : 'Recovery in progress'

  return (
    <div
      className={`frame tabbed${isReady ? '' : ' recovering'}`}
      style={isReady ? undefined : palette}
    >
      <div className="top">
        <span className="brand">
          <BrandMark />
          Gyminder
        </span>
        <span className={`pill${isReady ? ' ok' : ' rest'}`}>
          <span className="dot" />
          {isReady ? 'Ready to train' : 'Recovering'}
        </span>
      </div>

      <div className="body">
        <div className="screen-head">
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
                <linearGradient id="ringgradok" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--accent-2)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
                <linearGradient id="ringgradrest" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="var(--rc-light)" />
                  <stop offset="100%" stopColor="var(--rc-deep)" />
                </linearGradient>
              </defs>
              <circle
                className="ring-track"
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeWidth="6"
              />
              <circle
                className={`ring-arc${isReady ? ' charged' : ''}`}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeWidth="6"
                strokeDasharray={C}
                strokeDashoffset={offset}
              />
            </svg>
            {!isReady && (
              <div
                className="ring-tip"
                style={{ transform: `rotate(${tipDeg}deg)` }}
                aria-hidden="true"
              >
                <span className="ring-tip-dot" />
              </div>
            )}
            <div className="ring-center">
              <span className="ring-label">Next session</span>
              <span className="ring-big">{day?.label}</span>
              <span className={`ring-sub${isReady ? '' : ' rest'}`}>
                {isReady
                  ? 'Recovered'
                  : `Ready in ${formatIn(ready.readyAt - now)}`}
              </span>
            </div>
          </div>

          <div className="home-meta">
            <div className="hm-item">
              <b>
                <CountUp value={exCount} />
              </b>
              <span>exercises</span>
            </div>
            <span className="hm-sep" />
            <div className="hm-item">
              <b>
                <CountUp value={setCount} />
              </b>
              <span>sets</span>
            </div>
            <span className="hm-sep" />
            <div className="hm-item">
              <b>
                <CountUp value={estMin} />
              </b>
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
