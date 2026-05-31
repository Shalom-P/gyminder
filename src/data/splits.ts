import type { Split, Profile, AppState } from '../types'
import { CUSTOM_SPLIT_ID } from '../types'

/**
 * Training modes. Each is an ordered rotation of day templates; the app cycles
 * through `days` one session at a time. Exercise ids resolve through the
 * equipment/skip resolver at session start, so a template can list a barbell
 * lift and a bodyweight-only user still gets a doable variant.
 */
export const SPLITS: Split[] = [
  {
    id: 'full_body_3',
    name: 'Full Body',
    daysPerWeek: 3,
    levels: ['beginner', 'intermediate'],
    blurb: 'Every muscle, 3 sessions a week. Best for beginners and busy weeks.',
    days: [
      { id: 'fb_a', label: 'Full Body A', exercises: ['squat', 'bb_bench', 'bb_row', 'db_ohp', 'bb_curl', 'plank'] },
      { id: 'fb_b', label: 'Full Body B', exercises: ['rdl', 'ohp', 'lat_pulldown', 'incline_db', 'pushdown', 'calf_raise'] },
      { id: 'fb_c', label: 'Full Body C', exercises: ['leg_press', 'db_bench', 'cable_row', 'lat_raise', 'hammer_curl', 'hanging_leg_raise'] }
    ]
  },
  {
    id: 'upper_lower_4',
    name: 'Upper / Lower',
    daysPerWeek: 4,
    levels: ['intermediate', 'advanced'],
    blurb: 'Balanced 4-day split. Each muscle trained twice a week.',
    days: [
      { id: 'ul_ua', label: 'Upper A', exercises: ['bb_bench', 'bb_row', 'db_ohp', 'lat_pulldown', 'bb_curl', 'pushdown'] },
      { id: 'ul_la', label: 'Lower A', exercises: ['squat', 'rdl', 'leg_press', 'leg_curl', 'calf_raise', 'plank'] },
      { id: 'ul_ub', label: 'Upper B', exercises: ['incline_db', 'pullup', 'ohp', 'cable_row', 'hammer_curl', 'db_skullcrusher'] },
      { id: 'ul_lb', label: 'Lower B', exercises: ['deadlift', 'leg_press', 'lunge', 'leg_ext', 'calf_raise', 'hanging_leg_raise'] }
    ]
  },
  {
    id: 'ppl_3',
    name: 'Push / Pull / Legs (3-day)',
    daysPerWeek: 3,
    levels: ['beginner', 'intermediate'],
    blurb: 'The classic 3-day PPL. Simple, effective, one rotation a week.',
    days: [
      { id: 'ppl3_push', label: 'Push', exercises: ['bb_bench', 'ohp', 'incline_db', 'lat_raise', 'pushdown', 'overhead_ext'] },
      { id: 'ppl3_pull', label: 'Pull', exercises: ['deadlift', 'pullup', 'bb_row', 'cable_row', 'bb_curl', 'hammer_curl'] },
      { id: 'ppl3_legs', label: 'Legs', exercises: ['squat', 'rdl', 'leg_press', 'leg_curl', 'calf_raise', 'hanging_leg_raise'] }
    ]
  },
  {
    id: 'ppl_6',
    name: 'Push / Pull / Legs (6-day)',
    daysPerWeek: 6,
    levels: ['intermediate', 'advanced'],
    blurb: 'High-volume PPL run twice through. Each muscle hit twice a week.',
    days: [
      { id: 'ppl6_push_a', label: 'Push A', exercises: ['bb_bench', 'ohp', 'incline_db', 'lat_raise', 'pushdown'] },
      { id: 'ppl6_pull_a', label: 'Pull A', exercises: ['deadlift', 'pullup', 'bb_row', 'face_pull', 'bb_curl'] },
      { id: 'ppl6_legs_a', label: 'Legs A', exercises: ['squat', 'rdl', 'leg_press', 'leg_curl', 'calf_raise'] },
      { id: 'ppl6_push_b', label: 'Push B', exercises: ['db_bench', 'db_ohp', 'cable_fly', 'lat_raise', 'overhead_ext'] },
      { id: 'ppl6_pull_b', label: 'Pull B', exercises: ['lat_pulldown', 'cable_row', 'db_row', 'rear_delt_fly', 'hammer_curl'] },
      { id: 'ppl6_legs_b', label: 'Legs B', exercises: ['deadlift', 'hip_thrust', 'lunge', 'leg_ext', 'calf_raise'] }
    ]
  },
  {
    id: 'bro_5',
    name: 'Bro Split',
    daysPerWeek: 5,
    levels: ['intermediate', 'advanced'],
    blurb: 'One muscle group per day across 5 days. High per-session volume.',
    days: [
      { id: 'bro_chest', label: 'Chest', exercises: ['bb_bench', 'incline_db', 'cable_fly', 'db_fly', 'dip'] },
      { id: 'bro_back', label: 'Back', exercises: ['deadlift', 'pullup', 'bb_row', 'cable_row', 'face_pull'] },
      { id: 'bro_shoulders', label: 'Shoulders', exercises: ['ohp', 'db_ohp', 'lat_raise', 'cable_lat_raise', 'rear_delt_fly'] },
      { id: 'bro_legs', label: 'Legs', exercises: ['squat', 'rdl', 'leg_press', 'leg_curl', 'leg_ext', 'calf_raise'] },
      { id: 'bro_arms', label: 'Arms', exercises: ['bb_curl', 'close_bench', 'hammer_curl', 'pushdown', 'overhead_ext'] }
    ]
  },
  {
    id: 'ppl_ul_5',
    name: 'PPL + Upper / Lower',
    daysPerWeek: 5,
    levels: ['intermediate', 'advanced'],
    blurb: 'Hybrid 5-day: upper body 3x, legs 2x a week. Great all-rounder.',
    days: [
      { id: 'pplul_push', label: 'Push', exercises: ['bb_bench', 'ohp', 'incline_db', 'lat_raise', 'pushdown'] },
      { id: 'pplul_pull', label: 'Pull', exercises: ['deadlift', 'pullup', 'bb_row', 'face_pull', 'bb_curl'] },
      { id: 'pplul_legs', label: 'Legs', exercises: ['squat', 'rdl', 'leg_press', 'leg_curl', 'calf_raise'] },
      { id: 'pplul_upper', label: 'Upper', exercises: ['db_bench', 'cable_row', 'db_ohp', 'lat_pulldown', 'hammer_curl', 'db_skullcrusher'] },
      { id: 'pplul_lower', label: 'Lower', exercises: ['deadlift', 'hip_thrust', 'lunge', 'leg_ext', 'hanging_leg_raise'] }
    ]
  }
]

export const SPLIT_MAP: Record<string, Split> = Object.fromEntries(
  SPLITS.map((s) => [s.id, s])
)

export function getSplit(id: string): Split {
  const s = SPLIT_MAP[id]
  if (!s) throw new Error(`Unknown split: ${id}`)
  return s
}

/**
 * Resolve the split currently in use — a preset, or the user-built custom
 * split when currentSplitId is CUSTOM_SPLIT_ID. Returns null if none/unknown
 * so callers can no-op instead of throwing.
 */
export function getActiveSplit(
  state: Pick<AppState, 'currentSplitId' | 'customSplit'>
): Split | null {
  if (!state.currentSplitId) return null
  if (state.currentSplitId === CUSTOM_SPLIT_ID) return state.customSplit ?? null
  return SPLIT_MAP[state.currentSplitId] ?? null
}

/** Pick the most evidence-appropriate split for the onboarding answers. */
export function recommendSplitId(p: Profile): string {
  if (p.daysPerWeek >= 6) return 'ppl_6'
  if (p.daysPerWeek === 5) return 'ppl_ul_5'
  if (p.daysPerWeek === 4) return 'upper_lower_4'
  // 3 days
  return p.experience === 'beginner' ? 'full_body_3' : 'ppl_3'
}
