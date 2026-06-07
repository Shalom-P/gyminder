import { useCountUp } from '../hooks/useCountUp'

/**
 * Renders a number that counts up from 0 to `value` once on mount. A component
 * (not an inline hook call) so it can sit anywhere in JSX without entangling the
 * host's hook order — it re-counts whenever it remounts (e.g. entering a screen).
 */
export function CountUp({ value, dur }: { value: number; dur?: number }) {
  return <>{useCountUp(value, dur)}</>
}
