import type { Equipment } from '../types'
import { EXERCISES } from '../data/exercises'

export function canDo(exerciseId: string, equipment: Equipment): boolean {
  const ex = EXERCISES[exerciseId]
  if (!ex) return false
  if (equipment === 'full') return true
  if (equipment === 'dumbbell') return ex.equipment !== 'full'
  return ex.equipment === 'bodyweight'
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
