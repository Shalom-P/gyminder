import type { AppState, Muscle, SplitDay } from '../types'
import { EXERCISES } from '../data/exercises'
import { getActiveSplit } from '../data/splits'

const HOUR = 3600_000
const VERY_DUE = Number.MAX_SAFE_INTEGER

/** Recovery windows (hours) from current training-science consensus. */
const RECOVERY: Record<Muscle, number> = {
  chest: 60,
  back: 60,
  quads: 60,
  hamstrings: 60,
  glutes: 60,
  shoulders: 48,
  biceps: 36,
  triceps: 36,
  core: 24,
  calves: 24
}

/** Never run two sessions inside this window, even if muscles differ. */
const MIN_GAP_H = 20

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function musclesOf(day: SplitDay): Muscle[] {
  const set = new Set<Muscle>()
  for (const id of day.exercises) {
    const ex = EXERCISES[id]
    if (ex) set.add(ex.primary)
  }
  return [...set]
}

/** Most recent time this muscle was actually trained — across ALL days. */
function lastTrained(state: AppState, muscle: Muscle): number | null {
  let latest: number | null = null
  for (const rec of state.history) {
    const hit = rec.entries.some(
      (e) => e.status === 'done' && EXERCISES[e.exerciseId]?.primary === muscle
    )
    if (hit && (latest === null || rec.at > latest)) latest = rec.at
  }
  return latest
}

interface DayScore {
  day: SplitDay
  /** When every muscle in this day has cleared its recovery window. */
  readyAt: number
  recovered: boolean
  /** ms since this day's muscles were last trained (bigger = more overdue). */
  recency: number
  recoveredMuscles: Muscle[]
  recovering: Array<{ muscle: Muscle; readyAt: number }>
}

function scoreDay(state: AppState, day: SplitDay, now: number): DayScore {
  let readyAt = 0
  let mostRecent = -Infinity
  let untrained = false
  const recoveredMuscles: Muscle[] = []
  const recovering: Array<{ muscle: Muscle; readyAt: number }> = []

  for (const m of musclesOf(day)) {
    const lt = lastTrained(state, m)
    if (lt == null) {
      untrained = true
      recoveredMuscles.push(m)
      continue
    }
    mostRecent = Math.max(mostRecent, lt)
    const when = lt + RECOVERY[m] * HOUR
    readyAt = Math.max(readyAt, when)
    if (when <= now) recoveredMuscles.push(m)
    else recovering.push({ muscle: m, readyAt: when })
  }

  // Don't allow two sessions inside the minimum gap, even for fresh muscles.
  if (state.lastWorkoutAt != null) {
    readyAt = Math.max(readyAt, state.lastWorkoutAt + MIN_GAP_H * HOUR)
  }

  const recency =
    untrained || mostRecent === -Infinity ? VERY_DUE : now - mostRecent

  return {
    day,
    readyAt,
    recovered: readyAt <= now,
    recency,
    recoveredMuscles,
    recovering
  }
}

/**
 * Picks the best day to train *next* by accounting for the full multi-day
 * history: every split day is scored on whether its muscles have cleared
 * their recovery windows and how overdue they are, so the app adapts the
 * rotation to what the body has actually recovered rather than blindly
 * cycling.
 *
 * Tiebreak between equally-recovered days: prefer ones whose muscles
 * have NEVER been trained, then by recency (most-overdue first), then
 * rotation order. This keeps the user moving through every day of a split
 * instead of looping the same 3 days when one day's muscles slightly
 * overlap with the previous session (e.g. rear-delts in Pull B blocked
 * after Push B in a 6-day PPL).
 */
export function recommendDay(
  state: AppState,
  now = Date.now()
): DayScore | null {
  const split = getActiveSplit(state)
  if (!split || !split.days.length) return null
  const days = split.days

  const lastDayId = state.history.length
    ? state.history[state.history.length - 1].dayId
    : null

  const ordOf = (d: SplitDay) =>
    (days.indexOf(d) - state.rotationIndex + days.length) % days.length

  // Has this day been run in the *current* rotation cycle? "Cycle" here =
  // the last N entries where N = days.length, so once the user has done a
  // full rotation, the cycle resets and unseen-this-cycle flag flips back
  // on as appropriate. Catches the PPL6 case where Push B was never picked
  // because both Push A & B share the same muscles, so muscle-level
  // virginity stops distinguishing them after day 1.
  const cycleSize = days.length
  const cycleHistory = state.history.slice(-cycleSize)
  const doneThisCycle = new Set(cycleHistory.map((h) => h.dayId))
  const freshDay = (d: SplitDay) => (doneThisCycle.has(d.id) ? 0 : 1)

  const scored = days.map((d) => ({
    s: scoreDay(state, d, now),
    ord: ordOf(d),
    fresh: freshDay(d)
  }))

  // Avoid repeating the day just completed if any alternative exists.
  const notLast = scored.filter((x) => x.s.day.id !== lastDayId)
  const pool = notLast.length ? notLast : scored

  // Fresh-day tiebreak fires AFTER the user has trained at least once,
  // and only as a binary signal — we want to round-robin through every
  // day of the split before repeating.
  const useFresh = state.history.length > 0
  const cmpRecovered = (a: typeof scored[0], b: typeof scored[0]) =>
    (useFresh ? b.fresh - a.fresh : 0) ||
    b.s.recency - a.s.recency ||
    a.ord - b.ord

  const recovered = pool.filter((x) => x.s.recovered)
  if (recovered.length) {
    recovered.sort(cmpRecovered)
    const top = recovered[0]
    // If a not-yet-recovered day is FRESH (untried this cycle) and we're
    // past the minimum gap, prefer it — covers PPL+UL cases where
    // recovered days are all already-done while fresh days are still
    // recovering from yesterday's overlap. Only when the recovered top
    // isn't itself fresh.
    if (top.fresh === 0 && useFresh) {
      const altFresh = pool
        .filter((x) => !x.s.recovered && x.fresh > 0)
        .sort((a, b) => a.s.readyAt - b.s.readyAt || a.ord - b.ord)[0]
      if (altFresh) {
        const pastMinGap =
          state.lastWorkoutAt == null ||
          state.lastWorkoutAt + MIN_GAP_H * HOUR <= now
        if (pastMinGap) return altFresh.s
      }
    }
    return top.s
  }

  // Nothing fully recovered. Fresh-day still wins as tiebreak so we cover
  // unseen workouts before re-running ones the user has already done.
  pool.sort(
    (a, b) =>
      (useFresh ? b.fresh - a.fresh : 0) ||
      a.s.readyAt - b.s.readyAt ||
      a.ord - b.ord
  )
  return pool[0].s
}

export function upcomingDay(
  state: AppState,
  now = Date.now()
): SplitDay | null {
  return recommendDay(state, now)?.day ?? null
}

export interface ReadyInfo {
  dayLabel: string
  ready: boolean
  readyAt: number
  /** Per-muscle recovered/recovering summary, accounting for all days. */
  detail: string
  /** One-line reason this day is the suggestion. */
  why: string
}

export function nextReadyInfo(
  state: AppState,
  now = Date.now()
): ReadyInfo | null {
  const rec = recommendDay(state, now)
  if (!rec) return null

  const recoveredNames = rec.recoveredMuscles.map(cap)
  const recoveringParts = rec.recovering
    .sort((a, b) => a.readyAt - b.readyAt)
    .map((r) => `${cap(r.muscle)} in ${formatIn(r.readyAt - now)}`)

  let detail: string
  if (!recoveringParts.length) {
    detail =
      recoveredNames.length > 0
        ? `${recoveredNames.join(', ')} — all recovered`
        : 'All muscles recovered'
  } else if (recoveredNames.length) {
    detail = `${recoveredNames.join(', ')} recovered · ${recoveringParts.join(
      ' · '
    )}`
  } else {
    detail = `Recovering — ${recoveringParts.join(' · ')}`
  }

  const why = rec.recovered
    ? rec.recovering.length === 0
      ? 'Fully recovered — best day to train now'
      : 'Your most-rested muscle group'
    : 'Soonest muscle group to recover'

  return {
    dayLabel: rec.day.label,
    ready: rec.recovered,
    readyAt: rec.readyAt,
    detail,
    why
  }
}

export interface DayInfo {
  dayId: string
  label: string
  ready: boolean
  readyAt: number
  detail: string
}

/**
 * Recovery status of every day in the active split, accounting for the full
 * workout history — used by the "choose a workout" picker so the user can
 * switch what they train while still seeing what their body has recovered.
 */
export function listDayInfo(state: AppState, now = Date.now()): DayInfo[] {
  const split = getActiveSplit(state)
  if (!split) return []
  return split.days.map((d) => {
    const s = scoreDay(state, d, now)
    const recoveredNames = s.recoveredMuscles.map(cap)
    const recoveringParts = [...s.recovering]
      .sort((a, b) => a.readyAt - b.readyAt)
      .map((r) => `${cap(r.muscle)} in ${formatIn(r.readyAt - now)}`)
    let detail: string
    if (!recoveringParts.length) {
      detail = recoveredNames.length
        ? `${recoveredNames.join(', ')} — recovered`
        : 'Recovered'
    } else if (recoveredNames.length) {
      detail = `${recoveredNames.join(', ')} ready · ${recoveringParts.join(
        ' · '
      )}`
    } else {
      detail = `Recovering — ${recoveringParts.join(' · ')}`
    }
    return { dayId: d.id, label: d.label, ready: s.recovered, readyAt: s.readyAt, detail }
  })
}

export function recommendedDayId(
  state: AppState,
  now = Date.now()
): string | null {
  return recommendDay(state, now)?.day.id ?? null
}

export function relativeTime(ts: number | null, now = Date.now()): string {
  if (ts == null) return 'Never'
  const diff = now - ts
  if (diff < 0) return formatIn(-diff)
  if (diff < HOUR) return 'Just now'
  if (diff < 24 * HOUR) {
    const h = Math.round(diff / HOUR)
    return `${h}h ago`
  }
  const d = Math.round(diff / (24 * HOUR))
  return d === 1 ? 'Yesterday' : `${d}d ago`
}

export function formatIn(ms: number): string {
  if (ms <= 0) return 'now'
  const totalMin = Math.round(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h >= 24) {
    const d = Math.floor(h / 24)
    const rh = h % 24
    return rh ? `${d}d ${rh}h` : `${d}d`
  }
  if (h >= 1) return m ? `${h}h ${m}m` : `${h}h`
  return `${m}m`
}
