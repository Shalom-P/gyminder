import { EXERCISES } from '../data/exercises'
import { getCoaching } from '../data/coaching'
import { ChevronIcon } from '../components/icons'
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
  onOpen
}: {
  onOpen: (exerciseId: string) => void
}) {
  const all = Object.values(EXERCISES)

  return (
    <div className="frame tabbed">
      <div className="top">
        <span className="brand center">Exercise library</span>
        <span />
      </div>

      <div className="body scroll">
        <div className="screen-head">
          <h1 className="h1">Exercises</h1>
          <p className="muted">
            {all.length} exercises with animated demos, form cues and common
            mistakes. Tap any to learn it.
          </p>
        </div>
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
                      <span className="chev">
                        <ChevronIcon />
                      </span>
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
