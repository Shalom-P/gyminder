import { useRef, type PointerEvent } from 'react'

/**
 * iOS picker-wheel rollers. A cylinder of numbers where the centre item is
 * highlighted and its neighbours curve away and fade. `SetRoller` is display-
 * only (rolls to the current set); `ValueRoller` is interactive — drag up/down
 * or tap the top/bottom half to dial reps and weight.
 *
 * The pixel constants below MUST match `.roller`/`.roller-item` in styles.css.
 */
const ITEM_H = 36 // .roller-item height
const VIEW_H = 108 // .roller height

function curve(off: number): { transform: string; opacity: number } {
  const mag = Math.abs(off)
  const rot = Math.max(-72, Math.min(72, off * 26)) // cylinder curve
  const opacity = off === 0 ? 1 : Math.max(0.1, 1 - mag * 0.42)
  return { transform: `rotateX(${rot}deg)`, opacity }
}

export function SetRoller({
  total,
  current
}: {
  total: number
  current: number
}) {
  const safeTotal = Math.max(total, 1)
  const cur = Math.min(Math.max(current, 1), safeTotal) // 1-based
  const activeIdx = cur - 1
  const translate = VIEW_H / 2 - (activeIdx * ITEM_H + ITEM_H / 2)
  const nums = Array.from({ length: safeTotal }, (_, i) => i + 1)

  return (
    <div className="tstat roller-stat" role="img" aria-label={`Set ${cur} of ${safeTotal}`}>
      <span className="tstat-lbl">Set</span>
      <div className="roller roller-display" aria-hidden="true">
        <div className="roller-col" style={{ transform: `translateY(${translate}px)` }}>
          {nums.map((n, idx) => {
            const off = idx - activeIdx
            return (
              <div
                key={n}
                className={`roller-item${off === 0 ? ' active' : ''}`}
                style={curve(off)}
              >
                {n}
              </div>
            )
          })}
        </div>
      </div>
      <span className="roller-total">of {safeTotal}</span>
    </div>
  )
}

export function ValueRoller({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  onChange: (v: number) => void
}) {
  const round = (x: number) => Math.round(x * 1000) / 1000
  const snap = (x: number) => round(Math.round((x - min) / step) * step + min)
  const clamp = (x: number) => Math.min(max, Math.max(min, snap(x)))
  const v = clamp(value)

  const values: number[] = []
  for (let x = min; x <= max + 1e-9; x = round(x + step)) values.push(round(x))

  let activeIdx = 0
  let best = Infinity
  values.forEach((n, k) => {
    const d = Math.abs(n - v)
    if (d < best) {
      best = d
      activeIdx = k
    }
  })
  const translate = VIEW_H / 2 - (activeIdx * ITEM_H + ITEM_H / 2)

  const st = useRef({ startY: 0, startVal: v, moved: false, top: 0, h: VIEW_H })

  function down(e: PointerEvent<HTMLDivElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* not supported — taps still work */
    }
    const r = e.currentTarget.getBoundingClientRect()
    st.current = { startY: e.clientY, startVal: v, moved: false, top: r.top, h: r.height }
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (e.currentTarget.hasPointerCapture && !e.currentTarget.hasPointerCapture(e.pointerId))
      return
    const steps = Math.round(-(e.clientY - st.current.startY) / ITEM_H)
    if (steps !== 0) st.current.moved = true
    const nv = clamp(st.current.startVal + steps * step)
    if (Math.abs(nv - v) > 1e-9) onChange(nv)
  }
  function up(e: PointerEvent<HTMLDivElement>) {
    if (!st.current.moved) {
      const mid = st.current.top + st.current.h / 2
      onChange(clamp(v + (e.clientY < mid ? step : -step)))
    }
  }

  return (
    <div className="tstat roller-stat">
      <span className="tstat-lbl">{label}</span>
      <div
        className="roller roller-live"
        role="slider"
        aria-label={label}
        aria-valuenow={v}
        aria-valuemin={min}
        aria-valuemax={max}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
      >
        <div className="roller-band" />
        <div className="roller-col" style={{ transform: `translateY(${translate}px)` }}>
          {values.map((n, idx) => {
            const off = idx - activeIdx
            return (
              <div
                key={n}
                className={`roller-item${off === 0 ? ' active' : ''}`}
                style={curve(off)}
              >
                {n}
              </div>
            )
          })}
        </div>
      </div>
      <span className="roller-total">{suffix || ' '}</span>
    </div>
  )
}
