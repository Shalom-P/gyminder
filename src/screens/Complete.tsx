import { useState, type CSSProperties } from 'react'
import { useStore } from '../state/store'
import { formatIn, nextReadyInfo } from '../engine/schedule'
import { CheckIcon } from '../components/icons'
import { CountUp } from '../components/CountUp'
import DetailsSheet, { DetailRow, DetailsButton } from '../components/DetailsSheet'

// Radial confetti fanning out behind the success badge. Deterministic (placed by
// index, no randomness) so it's stable across re-renders; the motion is in CSS.
const BURST = Array.from({ length: 14 }, (_, i) => {
  const ang = (i / 14) * Math.PI * 2
  const dist = 66 + (i % 3) * 18
  return {
    style: {
      '--cx': `${Math.cos(ang) * dist}px`,
      '--cy': `${Math.sin(ang) * dist}px`,
      animationDelay: `${(i % 5) * 0.02}s`,
      background: i % 3 === 0 ? 'var(--accent-2)' : 'var(--accent)'
    } as CSSProperties
  }
})

// Positive, competence-framed sign-offs (peak-end rule + self-determination
// theory): celebrate the work done, never guilt. Chosen by session count so the
// line varies session to session without feeling random.
const SIGNOFFS = [
  "Strong work — that's logged.",
  "That's how progress compounds.",
  "Banked. Recovery starts now.",
  "Every set counted. Nice."
]

const WEEK = 7 * 24 * 60 * 60 * 1000

export default function Complete({ onHome }: { onHome: () => void }) {
  const { state } = useStore()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const now = Date.now()
  const last = state.history[state.history.length - 1]
  const done = last ? last.entries.filter((e) => e.status === 'done').length : 0
  const total = last ? last.entries.length : 0
  const thisWeek = state.history.filter((h) => h.at >= now - WEEK).length
  const allTime = state.history.length
  const ready = nextReadyInfo(state)
  const signoff = SIGNOFFS[allTime % SIGNOFFS.length]

  return (
    <div className="frame push">
      <div className="body">
        {/* Focus 1 — the celebration. */}
        <div className="complete-celebrate">
          <div className="success-wrap">
            <div className="burst" aria-hidden="true">
              {BURST.map((p, i) => (
                <i key={i} style={p.style} />
              ))}
            </div>
            <div className="success">
              <CheckIcon />
            </div>
          </div>
          <h1 className="h1 display">{last?.dayLabel} done</h1>
        </div>

        {/* Focus 2 — one number that matters. */}
        <div className="hero">
          <div className="hero-stat">
            <b>
              <CountUp value={done} dur={700} />
              <i>/{total}</i>
            </b>
            <span>exercises done</span>
          </div>
        </div>

        {/* Focus 3 — the one action. */}
        <div className="actions">
          <div className="details-row">
            <DetailsButton onClick={() => setDetailsOpen(true)} />
          </div>
          <button className="btn primary" onClick={onHome}>
            Back home
          </button>
        </div>
      </div>

      {detailsOpen && (
        <DetailsSheet title="Workout summary" onClose={() => setDetailsOpen(false)}>
          <p className="muted details-signoff">{signoff}</p>
          <div className="detail-list">
            <DetailRow label="This week" value={thisWeek} />
            <DetailRow label="All-time" value={allTime} />
            {ready && (
              <DetailRow
                label={`Next · ${ready.dayLabel}`}
                value={ready.ready ? 'Ready now' : `in ${formatIn(ready.readyAt - now)}`}
              />
            )}
          </div>
        </DetailsSheet>
      )}
    </div>
  )
}
