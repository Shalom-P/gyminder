import type { Equipment, Muscle, Split, SplitDay } from '../types'
import { CUSTOM_SPLIT_ID } from '../types'
import { EXERCISES } from './exercises'
import { resolveForEquipment } from '../engine/equipment'

/** A day "focus" the user can pick when building their own schedule. */
export interface Focus {
  id: string
  label: string
  hint: string
  muscles: Muscle[]
}

export const FOCUSES: Focus[] = [
  {
    id: 'full',
    label: 'Full body',
    hint: 'Everything in one session',
    muscles: ['quads', 'chest', 'back', 'hamstrings', 'shoulders', 'biceps', 'triceps', 'core']
  },
  { id: 'push', label: 'Push', hint: 'Chest, shoulders, triceps', muscles: ['chest', 'shoulders', 'triceps'] },
  { id: 'pull', label: 'Pull', hint: 'Back & biceps', muscles: ['back', 'biceps'] },
  { id: 'legs', label: 'Legs', hint: 'Quads, hamstrings, glutes, calves', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { id: 'upper', label: 'Upper body', hint: 'Chest, back, shoulders, arms', muscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'] },
  { id: 'lower', label: 'Lower body', hint: 'Legs, glutes, core', muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'core'] },
  { id: 'chest', label: 'Chest', hint: 'Chest focus', muscles: ['chest'] },
  { id: 'back', label: 'Back', hint: 'Back focus', muscles: ['back'] },
  { id: 'shoulders', label: 'Shoulders', hint: 'Delts', muscles: ['shoulders'] },
  { id: 'arms', label: 'Arms', hint: 'Biceps & triceps', muscles: ['biceps', 'triceps'] },
  { id: 'glutes', label: 'Glutes & hams', hint: 'Posterior chain', muscles: ['glutes', 'hamstrings'] },
  { id: 'core', label: 'Core', hint: 'Abs & midsection', muscles: ['core'] }
]

export function getFocus(id: string): Focus | undefined {
  return FOCUSES.find((f) => f.id === id)
}

const TYPE_W: Record<string, number> = {
  compound: 0,
  accessory: 1,
  isolation: 2
}

/**
 * Pick a balanced set of exercises for a focus: walk its muscles in order,
 * taking the best (compound-first) equipment-doable lift for each, then a
 * second pass for volume, capped to a sensible session length.
 */
function pickExercises(
  muscles: Muscle[],
  equipment: Equipment,
  max: number
): string[] {
  const byMuscle = (m: Muscle) =>
    Object.values(EXERCISES)
      .filter((e) => e.primary === m)
      .sort((a, b) => TYPE_W[a.type] - TYPE_W[b.type])

  const chosen: string[] = []
  const seen = new Set<string>()
  const take = (m: Muscle, n: number) => {
    let added = 0
    for (const e of byMuscle(m)) {
      if (chosen.length >= max || added >= n) break
      const rid = resolveForEquipment(e.id, equipment)
      if (rid && !seen.has(rid)) {
        seen.add(rid)
        chosen.push(rid)
        added++
      }
    }
  }

  for (const m of muscles) take(m, 1) // one per muscle first
  for (const m of muscles) {
    if (chosen.length >= max) break
    take(m, 1) // a second pass for volume
  }
  return chosen
}

export function buildCustomSplit(
  focusIds: string[],
  equipment: Equipment
): Split {
  const perDay = focusIds.length <= 3 ? 6 : 5
  const days: SplitDay[] = focusIds.map((fid, i) => {
    const f = getFocus(fid)
    const muscles = f ? f.muscles : (['chest'] as Muscle[])
    const exercises = pickExercises(muscles, equipment, perDay)
    return {
      id: `cust_d${i + 1}`,
      label: f ? f.label : `Day ${i + 1}`,
      exercises
    }
  })

  return {
    id: CUSTOM_SPLIT_ID,
    name: 'My Schedule',
    daysPerWeek: focusIds.length,
    levels: ['beginner', 'intermediate', 'advanced'],
    blurb: 'Your custom plan',
    days
  }
}
