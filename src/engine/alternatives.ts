import type { Equipment } from '../types'
import { EXERCISES } from '../data/exercises'
import { getCoaching } from '../data/coaching'
import { canDo } from './equipment'

export interface AlternativeOptions {
  /** Never offer these (e.g. the rest of today's plan). */
  exclude?: Iterable<string>
  limit?: number
  /** Only close matches — for filling a plan automatically, where a loose
   *  same-muscle pick (a press standing in for a rear-delt raise) would be
   *  worse than leaving the slot out. The Swap sheet lists the loose tail too,
   *  because there the user is choosing. */
  strict?: boolean
}

/**
 * Ranked alternatives for an exercise the user can't (or won't) do — "I don't
 * have this equipment". Preference order:
 *
 *   1. The curated substitution graph, nearest first. Direct substitutions are
 *      hand-ordered by biomechanical closeness (see data/exercises.ts) and may
 *      cross muscles on purpose (e.g. chin-up for a curl); second-hop ones are
 *      only kept when they train the same primary muscle, so chains never drift.
 *   2. Same primary muscle AND same movement pattern.
 *   3. Same primary muscle and same exercise type (compound/accessory/isolation).
 *   4. Same primary muscle, any type (not in strict mode).
 *
 * Only exercises doable with `equipment` are returned — never the exercise
 * itself or anything in `exclude`.
 */
export function alternativesFor(
  exerciseId: string,
  equipment: Equipment,
  { exclude = [], limit = 6, strict = false }: AlternativeOptions = {}
): string[] {
  const ex = EXERCISES[exerciseId]
  if (!ex) return []
  const skip = new Set(exclude)
  skip.add(exerciseId)
  const out: string[] = []
  const take = (id: string) => {
    if (out.length >= limit || skip.has(id) || !canDo(id, equipment)) return
    skip.add(id)
    out.push(id)
  }

  // 1. Curated graph, breadth-first over two hops.
  const seen = new Set([exerciseId])
  const hop2: string[] = []
  for (const id of ex.substitutions) {
    if (seen.has(id)) continue
    seen.add(id)
    take(id)
    hop2.push(...(EXERCISES[id]?.substitutions ?? []))
  }
  for (const id of hop2) {
    if (seen.has(id)) continue
    seen.add(id)
    if (EXERCISES[id]?.primary === ex.primary) take(id)
  }

  // 2-4. Same muscle, closest movement first (stable sort keeps dataset order).
  const pattern = getCoaching(exerciseId)?.pattern
  const rank = (id: string) => {
    if (getCoaching(id)?.pattern === pattern) return 0
    return EXERCISES[id].type === ex.type ? 1 : 2
  }
  Object.keys(EXERCISES)
    .filter((id) => EXERCISES[id].primary === ex.primary)
    .filter((id) => !strict || rank(id) < 2)
    .sort((a, b) => rank(a) - rank(b))
    .forEach(take)

  return out
}

/** The movement an exercise is: same-move variants with other kit share one. */
export function movementOf(id: string): string {
  return EXERCISES[id]?.variantOf ?? id
}

/** Every exercise that is one of these movements (the ids plus their variants). */
export function sameMovements(ids: Iterable<string>): string[] {
  const moves = new Set([...ids].map(movementOf))
  return Object.keys(EXERCISES).filter((id) => moves.has(movementOf(id)))
}

/**
 * Follow the user's remembered swaps from `exerciseId` ("instead of X, do Y")
 * to the exercise they actually want. Cycle-safe even on corrupted state.
 */
export function followSwaps(
  exerciseId: string,
  swaps: Record<string, string> | undefined
): string {
  if (!swaps) return exerciseId
  const seen = new Set<string>()
  let id = exerciseId
  while (swaps[id] && EXERCISES[swaps[id]] && !seen.has(id)) {
    seen.add(id)
    id = swaps[id]
  }
  return id
}

/**
 * Record "instead of `fromId`, do `toId`" without ever creating a cycle: the new
 * target becomes a chain end, so following swaps always terminates on it.
 */
export function rememberSwap(
  swaps: Record<string, string>,
  fromId: string,
  toId: string
): Record<string, string> {
  const next = { ...swaps }
  delete next[toId]
  if (fromId !== toId) next[fromId] = toId
  return next
}
