import type {
  Exercise,
  ExerciseProgress,
  PlanItem,
  Profile,
  ProgressState,
  SessionEntry,
  SplitDay,
  WeightUnit
} from '../types'
import { EXERCISES, getExercise } from '../data/exercises'
import { canDo, isBodyweight, resolveForEquipment } from './equipment'
import {
  alternativesFor,
  followSwaps,
  movementOf,
  sameMovements
} from './alternatives'

const HEAVY_COMPOUNDS = new Set([
  'squat',
  'deadlift',
  'leg_press',
  'rdl',
  'hip_thrust'
])

const SWAP_THRESHOLD = 2

/** Moves with no external load to add (bodyweight work, timed holds). */
function unloaded(ex: Exercise): boolean {
  return isBodyweight(ex) || ex.unit === 'sec'
}

export function initProgress(ex: Exercise): ExerciseProgress {
  return { suggestedWeight: null, targetReps: ex.repMin, streak: 0, misses: 0 }
}

export function getProgress(
  state: ProgressState,
  ex: Exercise
): ExerciseProgress {
  return state[ex.id] ?? initProgress(ex)
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/** The weight wheel's increment — suggestions always land on it. */
export function weightIncrement(units: WeightUnit = 'kg'): number {
  return units === 'lb' ? 5 : 2.5
}

/** Snap a weight onto the wheel so what's shown is exactly what's logged. */
export function snapWeight(w: number, units: WeightUnit = 'kg'): number {
  const inc = weightIncrement(units)
  return Math.round(Math.round(w / inc) * inc * 1000) / 1000
}

/**
 * Load added once the top of the rep range is reached — the ACSM's 2-10%
 * (Ratamess et al. 2009): the smallest practical jump (2.5 kg / 5 lb), or 2.5%
 * of the load if bigger; heavy lower-body compounds take double once the load
 * is ≥50 kg / 110 lb, where that still stays under 10%. Always whole wheel
 * steps, so suggestions land on the weight wheel. (On very light dumbbells the
 * smallest step is a big relative jump; the wide isolation rep ranges absorb
 * it — the target simply drops back to the bottom of the range.)
 */
function weightStep(ex: Exercise, load: number, units: WeightUnit = 'kg'): number {
  const inc = weightIncrement(units)
  const heavy = HEAVY_COMPOUNDS.has(ex.id) && load >= (units === 'lb' ? 110 : 50)
  const pct = Math.floor((load * 0.025) / inc) * inc
  return Math.max(heavy ? inc * 2 : inc, pct)
}

/**
 * Double progression: climb the rep range at a fixed load, then add weight and
 * drop back to the bottom of the range. Detailed input (reps/weight) makes the
 * next target exact; without it we still advance the target each session.
 * Unloaded moves (bodyweight, timed holds) have no weight to add, so they hold
 * at the top of the range — the session note then suggests a harder variation
 * — instead of resetting to an easier target with the same difficulty.
 */
export function applyResult(
  prev: ExerciseProgress,
  ex: Exercise,
  entry: SessionEntry,
  units: WeightUnit = 'kg'
): ExerciseProgress {
  if (entry.status === 'skip') {
    return { ...prev, streak: 0, misses: prev.misses + 1 }
  }

  const next: ExerciseProgress = { ...prev, misses: 0, streak: prev.streak + 1 }
  const hasReps = typeof entry.reps === 'number'

  if (hasReps) {
    const reps = entry.reps as number
    if (typeof entry.weight === 'number') next.suggestedWeight = entry.weight
    if (reps >= ex.repMax) {
      if (unloaded(ex)) {
        next.targetReps = ex.repMax
        return next
      }
      if (next.suggestedWeight != null) {
        next.suggestedWeight += weightStep(ex, next.suggestedWeight, units)
      }
      next.targetReps = ex.repMin
    } else {
      next.targetReps = clamp(reps + 1, ex.repMin, ex.repMax)
    }
    return next
  }

  // No detail: advance the target only.
  if (prev.targetReps >= ex.repMax) {
    if (unloaded(ex)) {
      next.targetReps = ex.repMax
      return next
    }
    next.targetReps = ex.repMin
    if (next.suggestedWeight != null) {
      next.suggestedWeight += weightStep(ex, next.suggestedWeight, units)
    }
  } else {
    next.targetReps = prev.targetReps + 1
  }
  return next
}

export interface BuiltPlan {
  items: PlanItem[]
  /** Original exercise ids whose miss-streak was consumed by a swap. */
  resetMisses: string[]
}

/**
 * Turn a split day into the concrete session: equipment-resolved exercises,
 * the user's remembered swaps, skip-swaps for repeatedly skipped lifts, and
 * coaching notes describing what to do next. A session never repeats an
 * exercise: when two templates land on the same lift (common on lower
 * equipment tiers) the second takes the next-best alternative, or is dropped
 * if none trains the same muscle.
 */
export function buildPlan(
  day: SplitDay,
  profile: Profile,
  progress: ProgressState,
  swaps: Record<string, string> = {}
): BuiltPlan {
  const eq = profile.equipment
  const items: PlanItem[] = []
  const resetMisses: string[] = []
  // Movements already in the session: an inverted row and a table row are the
  // same move with different kit, so one rules out the other.
  const used = new Set<string>()
  const closest = (id: string): string | undefined =>
    alternativesFor(id, eq, {
      exclude: sameMovements(used),
      limit: 1,
      strict: true
    })[0]

  for (const templateId of day.exercises) {
    let id = resolveForEquipment(templateId, eq)
    let from: string | undefined
    let note: string | undefined

    // The user's own swap ("I don't have this — use X") wins over the default.
    // Keyed by the lift they were given, else by the template itself.
    for (const key of new Set(id ? [id, templateId] : [templateId])) {
      const target = followSwaps(key, swaps)
      if (target !== key && canDo(target, eq)) {
        from = id ?? key
        id = target
        break
      }
    }

    if (id) {
      const p = progress[id] ?? initProgress(prescribe(getExercise(id), profile))
      if (p.misses >= SWAP_THRESHOLD) {
        const alt = closest(id)
        if (alt) {
          note = `Swapped in for ${getExercise(id).name} — you skipped it twice. Give this a try.`
          resetMisses.push(id)
          from = id
          id = alt
        }
      }
    }

    if (!id || used.has(movementOf(id))) {
      // Nothing doable in the curated chain, or already in today's plan.
      id = closest(templateId) ?? null
      from = undefined
      note = undefined
    }
    if (!id) continue
    used.add(movementOf(id))

    if (!note) {
      const ex = prescribe(getExercise(id), profile)
      const fp = progress[id] ?? initProgress(ex)
      if (fp.streak > 0 && unloaded(ex) && fp.targetReps >= ex.repMax) {
        note = 'Top of the range — slow the lowering, or Swap to a harder variation.'
      } else if (fp.streak > 0 && !unloaded(ex) && fp.targetReps === ex.repMin) {
        note = 'Progress: add a little weight vs. last time.'
      }
    }

    items.push({ exerciseId: id, note, from })
  }

  return { items, resetMisses }
}

/** Novices respond to low volumes: 1-3 sets per exercise (ACSM 2009). */
const BEGINNER_MAX_SETS = 3

/**
 * Rep range for loaded work by goal and experience; the dataset's ranges are
 * the "Build muscle" defaults for intermediate+ lifters. Isolation work and
 * unloaded moves keep their own ranges for every goal.
 *  - Get stronger: strength favours heavy loads (Lopez et al. 2021; ACSM 2026:
 *    ~80% 1RM+), so main lifts run 3-6 (deadlift 3-5), other compounds 5-8
 *    and accessories 6-10; beginners 5-8 while they learn the lifts.
 *  - Build muscle: hypertrophy is similar across loads near failure
 *    (Schoenfeld et al. 2017), so the dataset's moderate ranges; beginners
 *    8-12 on compounds, the ACSM's novice range (Ratamess et al. 2009).
 *  - General fitness: 8-12 (ACSM novice / general-health guidance).
 */
function repRange(ex: Exercise, profile: Profile): [number, number] {
  if (unloaded(ex) || ex.type === 'isolation') return [ex.repMin, ex.repMax]
  const beginner = profile.experience === 'beginner'
  if (profile.goal === 'strength') {
    if (ex.type === 'accessory') return [6, 10]
    return beginner ? [5, 8] : (ex.strength ?? [5, 8])
  }
  if (profile.goal === 'general') return [8, 12]
  return beginner && ex.type === 'compound' ? [8, 12] : [ex.repMin, ex.repMax]
}

/**
 * The lifter's prescription for one exercise: the dataset's "Build muscle"
 * targets adjusted for goal (repRange) and experience — beginners do at most
 * 3 sets per exercise (ACSM 2009). Unchanged exercises are returned as-is.
 */
export function prescribe(ex: Exercise, profile?: Profile | null): Exercise {
  if (!profile) return ex
  const [repMin, repMax] = repRange(ex, profile)
  const sets =
    profile.experience === 'beginner' ? Math.min(ex.sets, BEGINNER_MAX_SETS) : ex.sets
  if (sets === ex.sets && repMin === ex.repMin && repMax === ex.repMax) return ex
  return { ...ex, sets, repMin, repMax }
}

/**
 * Rest between sets (seconds). Longer rests preserve the reps — and so the
 * volume — of later sets: 3 min beat 1 min for strength and hypertrophy in
 * trained men (Schoenfeld et al. 2016), while hypertrophy gains plateau beyond
 * ~90 s (Singer et al. 2024), so single-joint work rests 90 s without cost.
 * Strength-focused loaded work rests longer — trained lifters need >2 min for
 * maximal strength gains (Grgic et al. 2018; ACSM 2009: 3-5 min on heavy sets).
 */
export function restSeconds(ex: Exercise, profile?: Profile | null): number {
  const strength = profile?.goal === 'strength' && !unloaded(ex)
  if (ex.type === 'compound') return strength ? 240 : 180
  if (ex.type === 'accessory') return strength ? 150 : 120
  return 90
}

export function describeTarget(
  exId: string,
  progress: ProgressState,
  profile?: Profile | null
): string {
  const t = targetParts(exId, progress, profile)
  if (!t) return ''
  const unit = t.isTime ? 's' : ''
  const load = t.bodyweight
    ? 'Bodyweight'
    : t.weight != null
      ? `@ ${t.weight} ${t.units}`
      : '@ —'
  return `${t.sets} × ${t.reps}${unit}  ${load}`
}

export interface TargetParts {
  sets: number
  reps: number
  /** true when reps are seconds (e.g. plank holds). */
  isTime: boolean
  bodyweight: boolean
  /** Suggested load, snapped onto the weight wheel. */
  weight: number | null
  units: WeightUnit
}

/**
 * Structured target for the rich set/rep/weight roller UI — hands each value to
 * the component separately (Sets / Reps|Hold / Weight|Body). Sets and the rep
 * range come from the lifter's prescription; a target saved under a different
 * goal is clamped into the current range.
 *
 * `opts` carries the global overrides from Settings → Targets: when the user
 * sets a custom sets/reps count it replaces the programmed values everywhere
 * (reps are left alone for timed holds, where "reps" are seconds).
 */
export function targetParts(
  exId: string,
  progress: ProgressState,
  profile?: Profile | null,
  opts?: { sets?: number; reps?: number }
): TargetParts | null {
  const base = EXERCISES[exId]
  if (!base) return null
  const ex = prescribe(base, profile)
  const units = profile?.units ?? 'kg'
  const p = progress[exId] ?? initProgress(ex)
  const isTime = ex.unit === 'sec'
  let sets = ex.sets
  let reps = clamp(p.targetReps, ex.repMin, ex.repMax)
  if (opts) {
    if (typeof opts.sets === 'number') sets = opts.sets
    if (typeof opts.reps === 'number' && !isTime) reps = opts.reps
  }
  return {
    sets,
    reps,
    isTime,
    bodyweight: isBodyweight(ex),
    weight: p.suggestedWeight != null ? snapWeight(p.suggestedWeight, units) : null,
    units
  }
}
