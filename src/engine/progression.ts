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
import { resolveForEquipment } from './equipment'

const HEAVY_COMPOUNDS = new Set([
  'squat',
  'deadlift',
  'leg_press',
  'rdl',
  'hip_thrust'
])

const SWAP_THRESHOLD = 2

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

function weightStep(ex: Exercise, current: number): number {
  const base = HEAVY_COMPOUNDS.has(ex.id) ? 5 : 2.5
  return Math.max(base, Math.round(current * 0.025 * 2) / 2)
}

/**
 * Double progression: climb the rep range at a fixed load, then add weight and
 * drop back to the bottom of the range. Detailed input (reps/weight) makes the
 * next target exact; without it we still advance the target each session.
 */
export function applyResult(
  prev: ExerciseProgress,
  ex: Exercise,
  entry: SessionEntry
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
      if (next.suggestedWeight != null) {
        next.suggestedWeight += weightStep(ex, next.suggestedWeight)
      }
      next.targetReps = ex.repMin
    } else {
      next.targetReps = clamp(reps + 1, ex.repMin, ex.repMax)
    }
    return next
  }

  // No detail: advance the target only.
  if (prev.targetReps >= ex.repMax) {
    next.targetReps = ex.repMin
    if (next.suggestedWeight != null) {
      next.suggestedWeight += weightStep(ex, next.suggestedWeight)
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
 * skip-swaps for repeatedly skipped lifts, and coaching notes describing what
 * to do next.
 */
export function buildPlan(
  day: SplitDay,
  profile: Profile,
  progress: ProgressState
): BuiltPlan {
  const items: PlanItem[] = []
  const resetMisses: string[] = []

  for (const templateId of day.exercises) {
    const resolvedId = resolveForEquipment(templateId, profile.equipment)
    if (!resolvedId) continue

    const baseEx = getExercise(resolvedId)
    const p = progress[resolvedId] ?? initProgress(baseEx)

    let finalId = resolvedId
    let note: string | undefined

    if (p.misses >= SWAP_THRESHOLD) {
      const alt = baseEx.substitutions
        .map((s) => resolveForEquipment(s, profile.equipment))
        .find((s): s is string => !!s && s !== resolvedId)
      if (alt) {
        finalId = alt
        note = `Swapped in for ${baseEx.name} — you skipped it twice. Give this a try.`
        resetMisses.push(resolvedId)
      }
    }

    if (!note) {
      const fp = progress[finalId] ?? initProgress(getExercise(finalId))
      if (fp.targetReps === getExercise(finalId).repMin && fp.streak > 0) {
        note = 'Progress: add a little weight vs. last time.'
      }
    }

    items.push({ exerciseId: finalId, note })
  }

  return { items, resetMisses }
}

/**
 * Rest between sets (seconds). Updated to current consensus (Schoenfeld et al.;
 * Grgic & Schoenfeld meta-analyses, 2021–2024): ≥2 min maximises hypertrophy
 * AND strength by preserving volume/mechanical tension — the old 30–60 s
 * "metabolic stress" guidance is outdated. Heavy multi-joint lifts get ~3 min;
 * small single-joint work can use ~90 s without compromising results.
 */
export function restSeconds(ex: Exercise): number {
  if (ex.type === 'compound') return 180
  if (ex.type === 'accessory') return 120
  return 90
}

export function describeTarget(
  exId: string,
  progress: ProgressState,
  units: WeightUnit = 'kg'
): string {
  const ex = EXERCISES[exId]
  if (!ex) return ''
  const p = progress[exId] ?? initProgress(ex)
  const unit = ex.unit === 'sec' ? 's' : ''
  const load =
    ex.equipment === 'bodyweight'
      ? 'Bodyweight'
      : p.suggestedWeight != null
        ? `@ ${p.suggestedWeight} ${units}`
        : '@ —'
  return `${ex.sets} × ${p.targetReps}${unit}  ${load}`
}

export interface TargetParts {
  sets: number
  reps: number
  /** true when reps are seconds (e.g. plank holds). */
  isTime: boolean
  bodyweight: boolean
  weight: number | null
  units: WeightUnit
}

/**
 * Structured target for the rich set/rep/weight roller UI — hands each value to
 * the component separately (Sets / Reps|Hold / Weight|Body).
 *
 * `opts` carries the global overrides from Settings → Targets: when the user
 * sets a custom sets/reps count it replaces the programmed values everywhere
 * (reps are left alone for timed holds, where "reps" are seconds).
 */
export function targetParts(
  exId: string,
  progress: ProgressState,
  units: WeightUnit = 'kg',
  opts?: { sets?: number; reps?: number }
): TargetParts | null {
  const ex = EXERCISES[exId]
  if (!ex) return null
  const p = progress[exId] ?? initProgress(ex)
  const isTime = ex.unit === 'sec'
  let sets = ex.sets
  let reps = p.targetReps
  if (opts) {
    if (typeof opts.sets === 'number') sets = opts.sets
    if (typeof opts.reps === 'number' && !isTime) reps = opts.reps
  }
  return {
    sets,
    reps,
    isTime,
    bodyweight: ex.equipment === 'bodyweight',
    weight: p.suggestedWeight,
    units
  }
}
