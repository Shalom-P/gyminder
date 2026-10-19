import { useEffect, useRef, type ReactNode } from 'react'
import { XIcon } from './icons'

/**
 * Progressive disclosure for the "three focus items" rule: every screen shows
 * only its title, its hero and its primary action; everything secondary lives
 * here, behind a "Details" tap, in a bottom sheet that rises over the screen.
 * Same dialog basics as SwapSheet — focus moves in once, Tab stays inside,
 * Escape closes.
 */
export default function DetailsSheet({
  title,
  onClose,
  children
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const sheetRef = useRef<HTMLDivElement>(null)
  // Read through a ref: the session re-renders every 250ms while resting, and
  // re-running the effect would keep yanking focus back to the sheet.
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

  return (
    <div className="sheet-layer">
      <div className="sheet-scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="sheet details-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={sheetRef}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <button className="icon-btn details-close" onClick={onClose} aria-label="Close">
          <XIcon />
        </button>
        {children}
      </div>
    </div>
  )
}

/** One label / value line inside a DetailsSheet. */
export function DetailRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <span className="detail-v">{value}</span>
    </div>
  )
}

/** The quiet "Details ⌃" toggle that sits just above a screen's primary button. */
export function DetailsButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="details-btn" onClick={onClick} aria-haspopup="dialog">
      Details
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 15l6-6 6 6" />
      </svg>
    </button>
  )
}
