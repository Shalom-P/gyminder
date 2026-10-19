/**
 * Equipment tiers, each including everything below it:
 *   full       — barbells, racks, machines, cables
 *   dumbbell   — dumbbells and an adjustable bench
 *   bodyweight — bodyweight work plus a pull-up bar / dip bars / rings
 *   none       — truly nothing but the body and household furniture
 * ('bodyweight' keeps its original meaning — with a bar — so saved profiles
 * resolve exactly as before.)
 */
export type Equipment = 'full' | 'dumbbell' | 'bodyweight' | 'none'
export type ExType = 'compound' | 'accessory' | 'isolation'
export type Muscle =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'calves'

export interface Exercise {
  id: string
  name: string
  primary: Muscle
  /** Synergists that do substantial work — counted as half a set each for
   *  volume and recovery (the fractional-set model of Pelland et al. 2025). */
  also: Muscle[]
  type: ExType
  /** Minimum equipment needed to perform it. */
  equipment: Equipment
  /** The specific kit it needs, in a few words ("Pull-up bar", "Dumbbells ·
   *  bench") — shown on alternatives so the user can pick one they can do. */
  kit: string
  sets: number
  /** Rep range for "Build muscle"; other goals are derived in prescribe(). */
  repMin: number
  repMax: number
  /** Heavier range for "Get stronger" where it differs from the default
   *  compound range (e.g. 3-5 on the deadlift). */
  strength?: [number, number]
  unit?: 'reps' | 'sec'
  /** Ordered fallback exercise ids (used for equipment swaps and skip swaps). */
  substitutions: string[]
  /** The same movement as another exercise with different kit (a table row is
   *  an inverted row) — a session never gets both. */
  variantOf?: string
}

export interface SplitDay {
  id: string
  label: string
  exercises: string[]
}

export interface Split {
  id: string
  name: string
  daysPerWeek: number
  levels: Array<'beginner' | 'intermediate' | 'advanced'>
  blurb: string
  days: SplitDay[]
}

export type Experience = 'beginner' | 'intermediate' | 'advanced'
export type Goal = 'muscle' | 'strength' | 'general' | 'shred'
export type WeightUnit = 'kg' | 'lb'
export type ThemeMode = 'dark' | 'light'

/**
 * Global target overrides (Settings → Targets). When `custom` is on, `sets`
 * and `reps` override every exercise's programmed target.
 */
export interface Settings {
  custom: boolean
  sets: number
  reps: number
}

export interface Profile {
  experience: Experience
  goal: Goal
  daysPerWeek: number
  equipment: Equipment
  /** Optional for backwards-compat with profiles saved before units existed. */
  units?: WeightUnit
}

export interface ExerciseProgress {
  suggestedWeight: number | null
  targetReps: number
  streak: number
  misses: number
}

export type ProgressState = Record<string, ExerciseProgress>

export interface SessionEntry {
  exerciseId: string
  status: 'done' | 'skip'
  reps?: number
  weight?: number
  /** Sets performed — drives the volume-based recovery estimate. Absent on
   *  entries saved before it existed (the prescription is assumed then). */
  sets?: number
}

export interface HistoryRecord {
  splitId: string
  dayId: string
  dayLabel: string
  at: number
  entries: SessionEntry[]
}

export interface PlanItem {
  exerciseId: string
  /** Coaching note: equipment swap, skip swap, or progression hint. */
  note?: string
  /** The exercise this item stands in for, when a swap (the user's own, or a
   *  skip-swap) replaced it — lets the session offer "back to" the original. */
  from?: string
}

export interface ActiveSession {
  splitId: string
  dayId: string
  dayLabel: string
  cursor: number
  plan: PlanItem[]
  entries: SessionEntry[]
  /** Current set within the active exercise (0-based). Lives in the store so it
   *  survives leaving for the How-to screen — and an app reload — mid-workout. */
  setIdx: number
  /** Wall-clock ms when the current rest ends, or null when not resting. */
  restEndsAt: number | null
}

export const CUSTOM_SPLIT_ID = 'custom'

export interface AppState {
  profile: Profile | null
  currentSplitId: string | null
  rotationIndex: number
  progress: ProgressState
  history: HistoryRecord[]
  lastWorkoutAt: number | null
  active: ActiveSession | null
  /** User-built split, used when currentSplitId === CUSTOM_SPLIT_ID. */
  customSplit: Split | null
  /** Global set/rep target overrides (Settings → Targets). */
  settings: Settings
  /** Remembered exercise swaps — "instead of X, always do Y" — set from the
   *  session's Swap sheet when the user lacks the equipment for X. */
  swaps: Record<string, string>
  /** Light or dark appearance. */
  theme: ThemeMode
}
