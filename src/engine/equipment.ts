import type { Equipment, Exercise } from '../types'
import { EXERCISES } from '../data/exercises'

/** Equipment tiers in ascending order — each includes everything below. */
const TIER: Record<Equipment, number> = {
  none: 0,
  bodyweight: 1,
  dumbbell: 2,
  full: 3
}

/** Moved with body weight alone (no bar or dumbbell load to track). */
export function isBodyweight(ex: Exercise): boolean {
  return ex.equipment === 'bodyweight' || ex.equipment === 'none'
}

export function canDo(exerciseId: string, equipment: Equipment): boolean {
  const ex = EXERCISES[exerciseId]
  if (!ex) return false
  return TIER[ex.equipment] <= (TIER[equipment] ?? TIER.full)
}

/**
 * Resolve a template exercise to one the user can actually do with their
 * equipment, walking the substitution graph breadth-first. Returns null only
 * if nothing in the chain is doable (then the exercise is dropped).
 */
export function resolveForEquipment(
  exerciseId: string,
  equipment: Equipment
): string | null {
  const seen = new Set<string>()
  const queue = [exerciseId]
  while (queue.length) {
    const id = queue.shift() as string
    if (seen.has(id)) continue
    seen.add(id)
    if (canDo(id, equipment)) return id
    const ex = EXERCISES[id]
    if (ex) queue.push(...ex.substitutions)
  }
  return null
}
