import { EXERCISES } from '../data/exercises'
import { getCoaching } from '../data/coaching'
import type { Muscle } from '../types'

const ORDER: Muscle[] = [
  'chest',
  'back',
  'shoulders',
  'quads',
  'hamstrings',
  'glutes',
  'biceps',
  'triceps',
  'core',
  'calves'
]

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export default function Library({
  onBack,
  onOpen
}: {
  onBack: () => void
  onOpen: (exerciseId: string) => void
}) {
  const all = Object.values(EXERCISES)

  return (
    <div className="frame">
      <div className="top">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ✕
        </button>
        <span className="brand">Exercise library</span>
      </div>

      <div className="body scroll">
        <p className="muted">
          {all.length} exercises with animated demos, form cues and common
          mistakes. Tap any to learn it.
        </p>
        {ORDER.map((muscle) => {
          const items = all.filter((e) => e.primary === muscle)
          if (!items.length) return null
          return (
            <div key={muscle}>
              <div className="group-label">{cap(muscle)}</div>
              <div className="list">
                {items.map((e) => {
                  const info = getCoaching(e.id)
                  return (
                    <button
                      key={e.id}
                      className="row-link"
                      onClick={() => onOpen(e.id)}
                    >
                      <span>
                        {e.name}
                        <span className="sub">
                          {info?.difficulty} · {e.type}
                        </span>
                      </span>
                      <span className="chev">›</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
