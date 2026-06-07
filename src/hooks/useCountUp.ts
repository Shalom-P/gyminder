import { useEffect, useState } from 'react'

/**
 * Animate a number from 0 up to `target` once on mount, eased (out-cubic).
 *
 * Driven by setInterval off Date.now() rather than requestAnimationFrame so it
 * still completes when the tab/app first paints while hidden (rAF is frozen on
 * hidden pages — the same hazard the boot-visibility guard handles for CSS).
 * Honours prefers-reduced-motion by snapping straight to the value.
 */
export function useCountUp(target: number, dur = 900): number {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setV(target)
      return
    }
    const start = Date.now()
    const id = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / dur)
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p >= 1) clearInterval(id)
    }, 1000 / 60)
    return () => clearInterval(id)
  }, [target, dur])
  return v
}
