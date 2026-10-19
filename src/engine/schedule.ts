import type { AppState, HistoryRecord, Muscle, SplitDay } from '../types'
import { EXERCISES } from '../data/exercises'
import { getActiveSplit } from '../data/splits'
import { prescribe } from './progression'

const HOUR = 3600_000
const VERY_DUE = Number.MAX_SAFE_INTEGER

/**
 * Hours until a muscle is ready again, from how hard the last session hit it —
 * not from its size. Performance after resistance training typically returns
 * within ~48 h, and recovery tracks volume and proximity to failure rather
 * than muscle group: squat, bench and deadlift recover alike (Belcher et al.
 * 2019), curls recovered slower than rows (Soares et al. 2015), and training
 * to failure adds 24-48 h (Morán-Navarro et al. 2017). So: a hard session
 * (≥10 fractional sets) gets 72 h, a light one (≤4) 24 h, anything else 48 h.
 * It is an estimate, and shown as one.
 */
export function recoveryHours(sets: number): number {
  if (sets >= 10) return 72
  if (sets <= 4) return 24
  return 48
}

/** Never run two sessions inside this window, even if muscles differ. */
const MIN_GAP_H = 20

/**
 * Fractional sets one session put on a muscle: every set of an exercise that
 * targets it counts 1, every set where it's a synergist counts 0.5 (the model
 * that best fit the volume data in Pelland et al. 2025). Entries saved before
 * sets were logged fall back to the lifter's prescription.
 */
export function setsOn(
  state: AppState,
  rec: HistoryRecord,
  muscle: Muscle
): number {
  let total = 0
  for (const e of rec.entries) {
    if (e.status !== 'done') continue
    const ex = EXERCISES[e.exerciseId]
    if (!ex) continue
    const share = ex.primary === muscle ? 1 : ex.also.includes(muscle) ? 0.5 : 0
    if (share) total += share * (e.sets ?? prescribe(ex, state.profile).sets)
  }
  return total
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * The muscles a day trains substantially — the ones whose recovery decides
 * when it's ready: the target of any compound lift, plus any muscle given ≥4
 * direct sets. A 3-set finisher (face pulls on a pull day, curls, calf raises)
 * doesn't hold a whole session back: light work is fine on a muscle that is
 * still recovering (≤4 sets is the "light" band in recoveryHours). A day of
 * only light work falls back to all of its muscles.
 */
function musclesOf(state: AppState, day: SplitDay): Muscle[] {
  const direct = new Map<Muscle, number>()
  const gating = new Set<Muscle>()
  for (const id of day.exercises) {
    const ex = EXERCISES[id]
    if (!ex) continue
    const sets = (direct.get(ex.primary) ?? 0) + prescribe(ex, state.profile).sets
    direct.set(ex.primary, sets)
    if (ex.type === 'compound' || sets >= 4) gating.add(ex.primary)
  }
  return gating.size ? [...gating] : [...direct.keys()]
}

/**
 * When this muscle was last trained and when it's ready again — across ALL
 * days, so a hard session two days ago can outlast a light one yesterday.
 * Under one fractional set (a brief synergist role) doesn't count at all.
 * `lastDirect` is the last session that targeted it directly — what "how
 * overdue is this day" compares — so synergist work (an RDL's back sets on leg
 * day) delays readiness without making a day look recently trained.
 */
function muscleStatus(
  state: AppState,
  muscle: Muscle
): { last: number | null; lastDirect: number | null; readyAt: number } {
  let last: number | null = null
  let lastDirect: number | null = null
  let readyAt = 0
  for (const rec of state.history) {
    const sets = setsOn(state, rec, muscle)
    if (sets < 1) continue
    if (last === null || rec.at > last) last = rec.at
    const direct = rec.entries.some(
      (e) => e.status === 'done' && EXERCISES[e.exerciseId]?.primary === muscle
    )
    if (direct && (lastDirect === null || rec.at > lastDirect)) lastDirect = rec.at
    readyAt = Math.max(readyAt, rec.at + recoveryHours(sets) * HOUR)
  }
  return { last, lastDirect, readyAt }
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

  for (const m of musclesOf(state, day)) {
    const { last, lastDirect, readyAt: when } = muscleStatus(state, m)
    if (last == null) {
      untrained = true
      recoveredMuscles.push(m)
      continue
    }
    mostRecent = Math.max(mostRecent, lastDirect ?? last)
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
