export type Equipment = 'full' | 'dumbbell' | 'bodyweight'
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
  type: ExType
  /** Minimum equipment needed to perform it. */
  equipment: Equipment
  sets: number
  repMin: number
  repMax: number
  unit?: 'reps' | 'sec'
  /** Ordered fallback exercise ids (used for equipment swaps and skip swaps). */
  substitutions: string[]
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
export type Goal = 'muscle' | 'strength' | 'general'
export type WeightUnit = 'kg' | 'lb'

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
}

export interface ActiveSession {
  splitId: string
  dayId: string
  dayLabel: string
  cursor: number
  plan: PlanItem[]
  entries: SessionEntry[]
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
}
