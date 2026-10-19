import type { Equipment, Muscle, Split, SplitDay } from '../types'
import { CUSTOM_SPLIT_ID } from '../types'
import { EXERCISES } from './exercises'
import { getCoaching, type Pattern } from './coaching'
import { resolveForEquipment } from '../engine/equipment'
import { movementOf } from '../engine/alternatives'

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

/** Kit closest to what the user has first: a full gym gets the machine leg
 *  curl before a Nordic, a dumbbell user the dumbbell row before a table row. */
const KIT_W: Record<Equipment, number> = {
  full: 0,
  dumbbell: 1,
  bodyweight: 2,
  none: 3
}

/** Movement families: a day takes one of each before doubling up. */
const FAMILY: Partial<Record<Pattern, string>> = {
  bench: 'horizontal press',
  pushup: 'horizontal press',
  ohp: 'vertical press',
  pike: 'vertical press',
  pulldown: 'vertical pull',
  pullup: 'vertical pull',
  facepull: 'rear delt',
  reardelt: 'rear delt',
  legcurl: 'knee flexion',
  nordic: 'knee flexion',
  slidecurl: 'knee flexion'
}

/** Heavy, fatiguing families never repeat in a session (no deadlift + RDL). */
const ONE_PER_DAY = new Set(['hinge', 'squat'])

function familyOf(id: string): string {
  const p = getCoaching(id)?.pattern
  return p ? FAMILY[p] ?? p : id
}

/** Arms already work hard in every press and pull, so their own slot goes to
 *  direct isolation work first (curls beat rows for the biceps — Mannarino
 *  et al. 2021). Other muscles lead with their big compound lifts. */
const ISOLATION_FIRST = new Set<Muscle>(['biceps', 'triceps'])

/** Direct sets per muscle in one session: extra growth seems to flatten out
 *  around here (Remmert et al. 2025 — a preprint, so treat it as soft). */
const SESSION_SET_CAP = 10

/**
 * Pick a balanced set of exercises for a focus. Round-robin over its muscles,
 * each turn taking that muscle's best candidate — resolved to the user's
 * equipment, kit closest to theirs first, then compounds first (isolation
 * first for arms) — that adds a movement family the day doesn't have yet.
 * Only if that leaves the day short (under four exercises, or a one- or
 * two-muscle focus) does a family repeat, at most twice — so a leg day gets a
 * squat, a hinge, a hip thrust and a leg curl rather than three hinges. No
 * muscle takes more than ~10 direct sets in the session.
 */
function pickExercises(
  muscles: Muscle[],
  equipment: Equipment,
  max: number
): string[] {
  const candidates = (m: Muscle): string[] => {
    const typeW = (t: string) =>
      ISOLATION_FIRST.has(m) ? 2 - TYPE_W[t] : TYPE_W[t]
    const resolved = new Set<string>()
    for (const e of Object.values(EXERCISES)) {
      if (e.primary !== m) continue
      const rid = resolveForEquipment(e.id, equipment)
      if (rid) resolved.add(rid)
    }
    return [...resolved].sort((a, b) => {
      const ea = EXERCISES[a]
      const eb = EXERCISES[b]
      return (
        KIT_W[ea.equipment] - KIT_W[eb.equipment] || typeW(ea.type) - typeW(eb.type)
      )
    })
  }

  const chosen: string[] = []
  const moves = new Set<string>()
  const families = new Map<string, number>()
  const sets = new Map<Muscle, number>()
  const tryTake = (m: Muscle, perFamily: number): boolean => {
    if ((sets.get(m) ?? 0) >= SESSION_SET_CAP) return false
    for (const id of candidates(m)) {
      if (moves.has(movementOf(id))) continue
      const fam = familyOf(id)
      const limit = ONE_PER_DAY.has(fam) ? 1 : perFamily
      if ((families.get(fam) ?? 0) >= limit) continue
      chosen.push(id)
      moves.add(movementOf(id))
      families.set(fam, (families.get(fam) ?? 0) + 1)
      sets.set(m, (sets.get(m) ?? 0) + EXERCISES[id].sets)
      return true
    }
    return false
  }

  // Distinct families first; then let families repeat once if the day is short.
  const minDay = Math.min(max, 4)
  for (const perFamily of [1, 2]) {
    const cap = perFamily === 1 || muscles.length <= 2 ? max : minDay
    let progressed = true
    while (chosen.length < cap && progressed) {
      progressed = false
      for (const m of muscles) {
        if (chosen.length >= cap) break
        if (tryTake(m, perFamily)) progressed = true
      }
    }
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
