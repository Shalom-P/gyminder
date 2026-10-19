import { useEffect, useRef, useState } from 'react'
import type { Equipment } from '../types'
import { EXERCISES } from '../data/exercises'
import { alternativesFor } from '../engine/alternatives'
import { canDo } from '../engine/equipment'
import { ChevronIcon, XIcon } from './icons'

/**
 * "I don't have this equipment" — a bottom sheet listing the closest
 * alternatives the user can do with their kit (same muscles, curated order),
 * each tagged with what it needs. One tap swaps; by default the swap is
 * remembered for future sessions (undo from the sheet or Settings).
 */
export default function SwapSheet({
  exerciseId,
  origin,
  equipment,
  exclude,
  onPick,
  onClose
}: {
  exerciseId: string
  /** The exercise this slot originally held, when it's already a swap. */
  origin?: string
  equipment: Equipment
  /** The rest of today's plan — never offered, so a session can't repeat. */
  exclude: string[]
  onPick: (toId: string, remember: boolean) => void
  onClose: () => void
}) {
  const [remember, setRemember] = useState(true)
  const sheetRef = useRef<HTMLDivElement>(null)
  const ex = EXERCISES[exerciseId]
  const slot = origin && EXERCISES[origin] ? origin : exerciseId
  // "Back to" only when the original is still doable (the kit may have changed
  // since the swap was saved).
  const back =
    slot !== exerciseId && canDo(slot, equipment) ? EXERCISES[slot] : undefined
  // Ranked for what the slot was built to train (the original, when this is
  // already a stand-in), never re-offering the current lift or the original.
  const alts = alternativesFor(slot, equipment, {
    exclude: [...exclude, exerciseId]
  })

  // Dialog basics: focus moves into the sheet once, Tab stays inside it, Escape
  // closes it. onClose is read through a ref — the session re-renders every
  // 250ms while resting, and re-running this would keep yanking focus.
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const sheet = sheetRef.current
    sheet?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      if (e.key !== 'Tab' || !sheet) return
      const items = sheet.querySelectorAll<HTMLElement>('button')
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === sheet)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!ex) return null

  return (
    <div className="sheet-layer">
      <div className="sheet-scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="swap-title"
        tabIndex={-1}
        ref={sheetRef}
      >
        <div className="sheet-head">
          <div className="screen-head">
            <span className="overline">Swap exercise</span>
            <h2 className="h2" id="swap-title">
              Instead of {ex.name}
            </h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <XIcon />
          </button>
        </div>

        <div className="seg2" role="group" aria-label="How long to swap">
          <button
            className={!remember ? 'on' : ''}
            aria-pressed={!remember}
            onClick={() => setRemember(false)}
          >
            Just today
          </button>
          <button
            className={remember ? 'on' : ''}
            aria-pressed={remember}
            onClick={() => setRemember(true)}
          >
            Every time
          </button>
        </div>

        <div className="list sheet-list scroll">
          {back && (
            <button
              className="row-link reco"
              onClick={() => onPick(back.id, remember)}
            >
              <span>
                Back to {back.name}
                <span className="sub">Your original exercise · {back.kit}</span>
              </span>
              <span className="chev">
                <ChevronIcon />
              </span>
            </button>
          )}
          {alts.map((id, i) => {
            const alt = EXERCISES[id]
            return (
              <button
                key={id}
                className="row-link"
                onClick={() => onPick(id, remember)}
              >
                <span>
                  {alt.name}
                  <span className="sub">
                    {i === 0 ? 'Closest match · ' : ''}
                    {alt.kit}
                  </span>
                </span>
                <span className="chev">
                  <ChevronIcon />
                </span>
              </button>
            )
          })}
          {!alts.length && !back && (
            <p className="muted">
              Nothing else fits your equipment for this one — skip it today.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
