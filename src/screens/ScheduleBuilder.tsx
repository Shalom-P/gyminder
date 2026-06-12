import { useState } from 'react'
import { useStore } from '../state/store'
import { FOCUSES, buildCustomSplit } from '../data/customSplit'
import { XIcon } from '../components/icons'

const DAY_OPTIONS = [3, 4, 5, 6]

export default function ScheduleBuilder({
  onBack,
  onDone
}: {
  onBack: () => void
  onDone: () => void
}) {
  const { state, setCustomSplit } = useStore()
  const [days, setDays] = useState<number | null>(null)
  const [picks, setPicks] = useState<string[]>([])

  const equipment = state.profile?.equipment ?? 'full'
  const totalSteps = days == null ? 1 : days + 1
  const stepIdx = days == null ? 0 : picks.length + 1

  function chooseDays(n: number) {
    setDays(n)
    setPicks([])
  }

  function chooseFocus(focusId: string) {
    const next = [...picks, focusId]
    if (days != null && next.length >= days) {
      setCustomSplit(buildCustomSplit(next, equipment))
      onDone()
      return
    }
    setPicks(next)
  }

  return (
    <div className="frame push">
      <div className="top">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <XIcon />
        </button>
        <div className="dots">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <i
              key={i}
              className={i === stepIdx ? 'on' : i < stepIdx ? 'done' : ''}
            />
          ))}
        </div>
      </div>

      <div className="body scroll">
        <div className="builder-step reveal" key={stepIdx}>
        {days == null ? (
          <>
            <div className="screen-head">
              <span className="eyebrow">Build your schedule</span>
              <h1 className="h1">How many training days?</h1>
              <p className="muted">
                You'll choose what each day focuses on next.
              </p>
            </div>
            <div className="spacer" />
            <div className="list">
              {DAY_OPTIONS.map((n) => (
                <button
                  key={n}
                  className="choice"
                  onClick={() => chooseDays(n)}
                >
                  <span className="title">{n} days / week</span>
                  <span className="muted">
                    {n} sessions to assign a focus to
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="screen-head">
              <span className="eyebrow">
                Day {picks.length + 1} of {days}
              </span>
              <h1 className="h1">What's this day's focus?</h1>
              <p className="muted">
                Exercises auto-fill from your equipment; timing adapts to
                recovery.
              </p>
            </div>
            <div className="spacer" />
            <div className="list">
              {FOCUSES.map((f) => (
                <button
                  key={f.id}
                  className="choice"
                  onClick={() => chooseFocus(f.id)}
                >
                  <span className="title">{f.label}</span>
                  <span className="muted">{f.hint}</span>
                </button>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  )
}
