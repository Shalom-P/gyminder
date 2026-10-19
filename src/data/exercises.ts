import type { Exercise } from '../types'

/**
 * Curated, evidence-based exercise pool. Rep ranges are the "Build muscle"
 * defaults: hypertrophy is similar across ~6-30 reps when sets end near failure
 * (Schoenfeld et al. 2017, Lopez et al. 2021), so loaded compounds use 6-10
 * (the deadlift 5-8, where fatigue erodes technique), accessories 8-12 and
 * isolation work 10-20; unloaded moves run higher. Other goals are derived in
 * engine/progression.ts prescribe().
 *
 * `primary` is the prime mover per EMG and training studies (e.g. the deadlift
 * is glute-led, chin-ups are a back exercise — see docs/EVIDENCE.md); `also`
 * lists synergists counted as half a set for volume and recovery.
 *
 * `substitutions` are ordered closest-first by movement and loading, spanning
 * lower equipment tiers so the resolver (engine/equipment.ts) always lands a
 * user on a sensible, doable lift. Bodyweight tiers default to the harder
 * single-leg/elevated variants: light loads only grow muscle when sets are
 * taken close to failure, which plain bilateral bodyweight moves rarely reach.
 */
const list: Exercise[] = [
  // ---- Chest ----
  { id: 'bb_bench', name: 'Barbell Bench Press', primary: 'chest', also: ['triceps', 'shoulders'], type: 'compound', equipment: 'full', kit: 'Barbell · bench · rack', sets: 4, repMin: 6, repMax: 10, strength: [3, 6], substitutions: ['db_bench', 'machine_press', 'pushup', 'pushup_feet_elev'] },
  { id: 'db_bench', name: 'Dumbbell Bench Press', primary: 'chest', also: ['triceps', 'shoulders'], type: 'compound', equipment: 'dumbbell', kit: 'Dumbbells · bench', sets: 4, repMin: 8, repMax: 12, substitutions: ['bb_bench', 'machine_press', 'pushup', 'pushup_feet_elev'] },
  { id: 'machine_press', name: 'Machine Chest Press', primary: 'chest', also: ['triceps', 'shoulders'], type: 'compound', equipment: 'full', kit: 'Chest press machine', sets: 3, repMin: 8, repMax: 12, substitutions: ['bb_bench', 'db_bench', 'pushup'] },
  { id: 'incline_db', name: 'Incline Dumbbell Press', primary: 'chest', also: ['shoulders', 'triceps'], type: 'accessory', equipment: 'dumbbell', kit: 'Dumbbells · incline bench', sets: 3, repMin: 8, repMax: 12, substitutions: ['incline_bb', 'pushup_feet_elev', 'db_bench', 'pushup'] },
  { id: 'incline_bb', name: 'Incline Barbell Press', primary: 'chest', also: ['shoulders', 'triceps'], type: 'accessory', equipment: 'full', kit: 'Barbell · incline bench', sets: 3, repMin: 6, repMax: 10, substitutions: ['incline_db', 'pushup_feet_elev', 'bb_bench', 'pushup'] },
  { id: 'pushup', name: 'Push-Up', primary: 'chest', also: ['triceps', 'shoulders'], type: 'compound', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 8, repMax: 20, substitutions: ['pushup_incline', 'pushup_feet_elev', 'db_bench', 'bb_bench'] },
  { id: 'pushup_incline', name: 'Incline Push-Up', primary: 'chest', also: ['triceps', 'shoulders'], type: 'accessory', equipment: 'none', kit: 'Bench, table or wall', sets: 3, repMin: 8, repMax: 20, substitutions: ['pushup', 'db_bench'] },
  { id: 'pushup_feet_elev', name: 'Feet-Elevated Push-Up', primary: 'chest', also: ['shoulders', 'triceps'], type: 'compound', equipment: 'none', kit: 'A step, bench or chair', sets: 3, repMin: 6, repMax: 15, substitutions: ['pushup', 'incline_db', 'db_bench'] },
  { id: 'cable_fly', name: 'Cable Fly', primary: 'chest', also: [], type: 'isolation', equipment: 'full', kit: 'Cable station', sets: 3, repMin: 12, repMax: 15, substitutions: ['db_fly', 'pushup'] },
  { id: 'db_fly', name: 'Dumbbell Fly', primary: 'chest', also: [], type: 'isolation', equipment: 'dumbbell', kit: 'Dumbbells · bench', sets: 3, repMin: 12, repMax: 15, substitutions: ['cable_fly', 'pushup'] },

  // ---- Back ----
  { id: 'pullup', name: 'Pull-Up', primary: 'back', also: ['biceps'], type: 'compound', equipment: 'bodyweight', kit: 'Pull-up bar', sets: 4, repMin: 5, repMax: 12, substitutions: ['lat_pulldown', 'chin_up', 'inv_row', 'db_row', 'table_row'] },
  { id: 'lat_pulldown', name: 'Lat Pulldown', primary: 'back', also: ['biceps'], type: 'compound', equipment: 'full', kit: 'Pulldown machine', sets: 4, repMin: 8, repMax: 12, substitutions: ['pullup', 'chin_up', 'db_row', 'inv_row', 'table_row'] },
  { id: 'chin_up', name: 'Chin-Up', primary: 'back', also: ['biceps'], type: 'compound', equipment: 'bodyweight', kit: 'Pull-up bar', sets: 3, repMin: 5, repMax: 10, substitutions: ['lat_pulldown', 'pullup', 'inv_row', 'table_row'] },
  { id: 'bb_row', name: 'Barbell Row', primary: 'back', also: ['biceps', 'shoulders'], type: 'compound', equipment: 'full', kit: 'Barbell', sets: 4, repMin: 6, repMax: 10, substitutions: ['cs_db_row', 'cable_row', 'db_row', 'inv_row', 'table_row'] },
  { id: 'db_row', name: 'One-Arm Dumbbell Row', primary: 'back', also: ['biceps'], type: 'accessory', equipment: 'dumbbell', kit: 'Dumbbell · bench', sets: 3, repMin: 8, repMax: 12, substitutions: ['cs_db_row', 'cable_row', 'inv_row', 'table_row'] },
  { id: 'cs_db_row', name: 'Chest-Supported Dumbbell Row', primary: 'back', also: ['biceps', 'shoulders'], type: 'accessory', equipment: 'dumbbell', kit: 'Dumbbells · incline bench', sets: 3, repMin: 8, repMax: 12, substitutions: ['db_row', 'cable_row', 'inv_row', 'table_row'] },
  { id: 'cable_row', name: 'Seated Cable Row', primary: 'back', also: ['biceps'], type: 'accessory', equipment: 'full', kit: 'Cable row station', sets: 3, repMin: 8, repMax: 12, substitutions: ['cs_db_row', 'db_row', 'inv_row', 'table_row'] },
  { id: 'inv_row', name: 'Inverted Row', primary: 'back', also: ['biceps', 'shoulders'], type: 'accessory', equipment: 'bodyweight', kit: 'Low bar or rings', sets: 3, repMin: 8, repMax: 15, substitutions: ['table_row', 'db_row', 'cs_db_row'] },
  { id: 'table_row', name: 'Table Row', primary: 'back', also: ['biceps'], type: 'accessory', equipment: 'none', kit: 'A sturdy table', sets: 3, repMin: 8, repMax: 15, substitutions: ['inv_row', 'db_row'], variantOf: 'inv_row' },

  // ---- Shoulders ----
  { id: 'ohp', name: 'Overhead Press', primary: 'shoulders', also: ['triceps'], type: 'compound', equipment: 'full', kit: 'Barbell · rack', sets: 4, repMin: 6, repMax: 10, strength: [3, 6], substitutions: ['db_ohp', 'pike_pushup'] },
  { id: 'db_ohp', name: 'Dumbbell Shoulder Press', primary: 'shoulders', also: ['triceps'], type: 'compound', equipment: 'dumbbell', kit: 'Dumbbells', sets: 4, repMin: 8, repMax: 12, substitutions: ['ohp', 'pike_pushup'] },
  { id: 'pike_pushup', name: 'Pike Push-Up', primary: 'shoulders', also: ['triceps'], type: 'accessory', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 6, repMax: 15, substitutions: ['db_ohp', 'pushup_feet_elev'] },
  { id: 'lat_raise', name: 'Lateral Raise', primary: 'shoulders', also: [], type: 'isolation', equipment: 'dumbbell', kit: 'Dumbbells', sets: 3, repMin: 12, repMax: 20, substitutions: ['cable_lat_raise', 'db_ohp', 'pike_pushup'] },
  { id: 'cable_lat_raise', name: 'Cable Lateral Raise', primary: 'shoulders', also: [], type: 'isolation', equipment: 'full', kit: 'Cable station', sets: 3, repMin: 12, repMax: 20, substitutions: ['lat_raise', 'db_ohp', 'pike_pushup'] },
  { id: 'face_pull', name: 'Face Pull', primary: 'shoulders', also: ['back'], type: 'isolation', equipment: 'full', kit: 'Cable · rope', sets: 3, repMin: 12, repMax: 20, substitutions: ['rear_delt_fly', 'prone_yt_raise'] },
  { id: 'rear_delt_fly', name: 'Rear Delt Fly', primary: 'shoulders', also: ['back'], type: 'isolation', equipment: 'dumbbell', kit: 'Dumbbells', sets: 3, repMin: 12, repMax: 20, substitutions: ['face_pull', 'prone_yt_raise'] },
  { id: 'prone_yt_raise', name: 'Prone Y-T Raise', primary: 'shoulders', also: ['back'], type: 'isolation', equipment: 'none', kit: 'A mat', sets: 3, repMin: 10, repMax: 15, substitutions: ['rear_delt_fly', 'face_pull'] },

  // ---- Quads ----
  { id: 'squat', name: 'Barbell Back Squat', primary: 'quads', also: ['glutes'], type: 'compound', equipment: 'full', kit: 'Barbell · squat rack', sets: 4, repMin: 6, repMax: 10, strength: [3, 6], substitutions: ['leg_press', 'goblet_squat', 'bss', 'bw_bss', 'bw_squat'] },
  { id: 'leg_press', name: 'Leg Press', primary: 'quads', also: ['glutes'], type: 'compound', equipment: 'full', kit: 'Leg press machine', sets: 3, repMin: 8, repMax: 12, strength: [6, 10], substitutions: ['squat', 'bss', 'goblet_squat', 'bw_bss'] },
  { id: 'goblet_squat', name: 'Goblet Squat', primary: 'quads', also: ['glutes'], type: 'compound', equipment: 'dumbbell', kit: 'One dumbbell', sets: 3, repMin: 8, repMax: 12, strength: [6, 10], substitutions: ['bss', 'squat', 'bw_bss', 'bw_squat'] },
  { id: 'bss', name: 'Bulgarian Split Squat', primary: 'quads', also: ['glutes'], type: 'accessory', equipment: 'dumbbell', kit: 'Dumbbells · bench', sets: 3, repMin: 8, repMax: 12, substitutions: ['lunge', 'goblet_squat', 'bw_bss'] },
  { id: 'bw_bss', name: 'Bodyweight Bulgarian Split Squat', primary: 'quads', also: ['glutes'], type: 'accessory', equipment: 'none', kit: 'A chair or step', sets: 3, repMin: 8, repMax: 15, substitutions: ['bw_lunge', 'step_up', 'bw_squat', 'bss'], variantOf: 'bss' },
  { id: 'bw_squat', name: 'Bodyweight Squat', primary: 'quads', also: ['glutes'], type: 'accessory', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 15, repMax: 30, substitutions: ['bw_bss', 'step_up', 'bw_lunge', 'goblet_squat'], variantOf: 'goblet_squat' },
  { id: 'lunge', name: 'Walking Lunge', primary: 'quads', also: ['glutes'], type: 'accessory', equipment: 'dumbbell', kit: 'Dumbbells', sets: 3, repMin: 8, repMax: 12, substitutions: ['bss', 'bw_lunge', 'bw_bss'] },
  { id: 'bw_lunge', name: 'Bodyweight Lunge', primary: 'quads', also: ['glutes'], type: 'accessory', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 12, repMax: 20, substitutions: ['bw_bss', 'step_up', 'lunge'], variantOf: 'lunge' },
  { id: 'step_up', name: 'Step-Up', primary: 'quads', also: ['glutes'], type: 'accessory', equipment: 'none', kit: 'A sturdy step or chair', sets: 3, repMin: 8, repMax: 15, substitutions: ['bw_bss', 'bw_lunge', 'lunge'] },
  { id: 'leg_ext', name: 'Leg Extension', primary: 'quads', also: [], type: 'isolation', equipment: 'full', kit: 'Leg extension machine', sets: 3, repMin: 10, repMax: 15, substitutions: ['bss', 'goblet_squat', 'bw_bss'] },

  // ---- Hamstrings ----
  { id: 'rdl', name: 'Romanian Deadlift', primary: 'hamstrings', also: ['glutes', 'back'], type: 'compound', equipment: 'full', kit: 'Barbell', sets: 3, repMin: 6, repMax: 10, substitutions: ['db_rdl', 'sl_rdl', 'nordic', 'deadlift'] },
  { id: 'db_rdl', name: 'Dumbbell RDL', primary: 'hamstrings', also: ['glutes', 'back'], type: 'accessory', equipment: 'dumbbell', kit: 'Dumbbells', sets: 3, repMin: 8, repMax: 12, substitutions: ['rdl', 'sl_rdl', 'nordic'] },
  { id: 'sl_rdl', name: 'Single-Leg Romanian Deadlift', primary: 'hamstrings', also: ['glutes'], type: 'accessory', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 8, repMax: 12, substitutions: ['db_rdl', 'nordic', 'rdl'] },
  { id: 'leg_curl', name: 'Seated Leg Curl', primary: 'hamstrings', also: [], type: 'isolation', equipment: 'full', kit: 'Seated leg curl machine', sets: 3, repMin: 10, repMax: 15, substitutions: ['lying_leg_curl', 'nordic', 'slider_curl'] },
  { id: 'lying_leg_curl', name: 'Lying Leg Curl', primary: 'hamstrings', also: [], type: 'isolation', equipment: 'full', kit: 'Lying leg curl machine', sets: 3, repMin: 10, repMax: 15, substitutions: ['leg_curl', 'nordic', 'slider_curl'] },
  { id: 'nordic', name: 'Nordic Hamstring Curl', primary: 'hamstrings', also: [], type: 'accessory', equipment: 'none', kit: 'Feet anchored: sofa or partner', sets: 2, repMin: 4, repMax: 8, substitutions: ['slider_curl', 'leg_curl'] },
  { id: 'slider_curl', name: 'Sliding Leg Curl', primary: 'hamstrings', also: ['glutes'], type: 'accessory', equipment: 'none', kit: 'Towel on a smooth floor', sets: 3, repMin: 8, repMax: 15, substitutions: ['nordic', 'leg_curl'] },

  // ---- Glutes ----
  { id: 'deadlift', name: 'Deadlift', primary: 'glutes', also: ['hamstrings', 'back', 'quads'], type: 'compound', equipment: 'full', kit: 'Barbell · plates', sets: 3, repMin: 5, repMax: 8, strength: [3, 5], substitutions: ['rdl', 'db_rdl', 'sl_rdl', 'hip_thrust', 'hip_bridge'] },
  { id: 'hip_thrust', name: 'Hip Thrust', primary: 'glutes', also: ['hamstrings'], type: 'compound', equipment: 'full', kit: 'Barbell · bench', sets: 3, repMin: 8, repMax: 12, substitutions: ['db_hip_thrust', 'sl_glute_bridge', 'hip_bridge', 'step_up'] },
  { id: 'db_hip_thrust', name: 'Dumbbell Hip Thrust', primary: 'glutes', also: ['hamstrings'], type: 'accessory', equipment: 'dumbbell', kit: 'A dumbbell · bench', sets: 3, repMin: 10, repMax: 15, substitutions: ['hip_thrust', 'sl_glute_bridge', 'hip_bridge'], variantOf: 'hip_thrust' },
  { id: 'sl_glute_bridge', name: 'Single-Leg Glute Bridge', primary: 'glutes', also: ['hamstrings'], type: 'accessory', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 8, repMax: 15, substitutions: ['hip_bridge', 'db_hip_thrust', 'step_up'], variantOf: 'hip_bridge' },
  { id: 'hip_bridge', name: 'Glute Bridge', primary: 'glutes', also: ['hamstrings'], type: 'accessory', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 12, repMax: 25, substitutions: ['sl_glute_bridge', 'db_hip_thrust', 'hip_thrust'] },

  // ---- Biceps ----
  { id: 'bb_curl', name: 'Barbell Curl', primary: 'biceps', also: [], type: 'isolation', equipment: 'full', kit: 'Barbell or EZ-bar', sets: 3, repMin: 8, repMax: 12, substitutions: ['db_curl', 'chin_up', 'table_row'] },
  { id: 'db_curl', name: 'Dumbbell Curl', primary: 'biceps', also: [], type: 'isolation', equipment: 'dumbbell', kit: 'Dumbbells', sets: 3, repMin: 8, repMax: 12, substitutions: ['bb_curl', 'hammer_curl', 'chin_up', 'table_row'] },
  { id: 'hammer_curl', name: 'Hammer Curl', primary: 'biceps', also: [], type: 'isolation', equipment: 'dumbbell', kit: 'Dumbbells', sets: 3, repMin: 8, repMax: 12, substitutions: ['db_curl', 'chin_up', 'table_row'] },

  // ---- Triceps ----
  { id: 'close_bench', name: 'Close-Grip Bench Press', primary: 'triceps', also: ['chest', 'shoulders'], type: 'compound', equipment: 'full', kit: 'Barbell · bench', sets: 3, repMin: 6, repMax: 10, strength: [3, 6], substitutions: ['dip', 'diamond_pushup'] },
  { id: 'dip', name: 'Triceps Dip', primary: 'triceps', also: ['chest', 'shoulders'], type: 'compound', equipment: 'bodyweight', kit: 'Dip bars', sets: 3, repMin: 6, repMax: 12, substitutions: ['diamond_pushup', 'close_bench'] },
  { id: 'pushdown', name: 'Triceps Pushdown', primary: 'triceps', also: [], type: 'isolation', equipment: 'full', kit: 'Cable station', sets: 3, repMin: 10, repMax: 15, substitutions: ['overhead_ext', 'cable_oh_ext', 'db_skullcrusher', 'diamond_pushup'] },
  { id: 'cable_oh_ext', name: 'Overhead Cable Extension', primary: 'triceps', also: [], type: 'isolation', equipment: 'full', kit: 'Cable · rope', sets: 3, repMin: 10, repMax: 15, substitutions: ['overhead_ext', 'pushdown', 'diamond_pushup'] },
  { id: 'overhead_ext', name: 'Overhead Dumbbell Extension', primary: 'triceps', also: [], type: 'isolation', equipment: 'dumbbell', kit: 'One dumbbell', sets: 3, repMin: 10, repMax: 15, substitutions: ['cable_oh_ext', 'db_skullcrusher', 'diamond_pushup'] },
  { id: 'db_skullcrusher', name: 'Dumbbell Skullcrusher', primary: 'triceps', also: [], type: 'isolation', equipment: 'dumbbell', kit: 'Dumbbells · bench', sets: 3, repMin: 10, repMax: 15, substitutions: ['overhead_ext', 'pushdown', 'diamond_pushup'] },
  { id: 'diamond_pushup', name: 'Diamond Push-Up', primary: 'triceps', also: ['chest'], type: 'accessory', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 8, repMax: 20, substitutions: ['dip', 'close_bench', 'pushup'] },

  // ---- Core ----
  { id: 'plank', name: 'Plank', primary: 'core', also: [], type: 'isolation', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 30, repMax: 60, unit: 'sec', substitutions: ['side_plank', 'crunch'] },
  { id: 'side_plank', name: 'Side Plank', primary: 'core', also: [], type: 'isolation', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 20, repMax: 45, unit: 'sec', substitutions: ['plank'] },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', primary: 'core', also: [], type: 'isolation', equipment: 'bodyweight', kit: 'Pull-up bar', sets: 3, repMin: 8, repMax: 15, substitutions: ['reverse_crunch', 'crunch', 'cable_crunch'] },
  { id: 'reverse_crunch', name: 'Reverse Crunch', primary: 'core', also: [], type: 'isolation', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 10, repMax: 20, substitutions: ['crunch', 'hanging_leg_raise'] },
  { id: 'crunch', name: 'Crunch', primary: 'core', also: [], type: 'isolation', equipment: 'none', kit: 'No equipment', sets: 3, repMin: 12, repMax: 20, substitutions: ['reverse_crunch', 'cable_crunch'] },
  { id: 'cable_crunch', name: 'Cable Crunch', primary: 'core', also: [], type: 'isolation', equipment: 'full', kit: 'Cable · rope', sets: 3, repMin: 10, repMax: 20, substitutions: ['crunch', 'reverse_crunch'] },

  // ---- Calves ----
  { id: 'calf_raise', name: 'Standing Calf Raise', primary: 'calves', also: [], type: 'isolation', equipment: 'full', kit: 'Calf raise machine', sets: 4, repMin: 10, repMax: 20, substitutions: ['db_calf_raise', 'sl_calf_raise', 'bw_calf_raise'] },
  { id: 'db_calf_raise', name: 'Dumbbell Calf Raise', primary: 'calves', also: [], type: 'isolation', equipment: 'dumbbell', kit: 'Dumbbells · a step', sets: 4, repMin: 10, repMax: 20, substitutions: ['calf_raise', 'sl_calf_raise'], variantOf: 'calf_raise' },
  { id: 'sl_calf_raise', name: 'Single-Leg Calf Raise', primary: 'calves', also: [], type: 'isolation', equipment: 'none', kit: 'A step', sets: 3, repMin: 10, repMax: 20, substitutions: ['db_calf_raise', 'bw_calf_raise'], variantOf: 'calf_raise' },
  { id: 'bw_calf_raise', name: 'Bodyweight Calf Raise', primary: 'calves', also: [], type: 'isolation', equipment: 'none', kit: 'A step', sets: 3, repMin: 15, repMax: 30, substitutions: ['sl_calf_raise', 'calf_raise'], variantOf: 'calf_raise' }
]

export const EXERCISES: Record<string, Exercise> = Object.fromEntries(
  list.map((e) => [e.id, e])
)

export function getExercise(id: string): Exercise {
  const ex = EXERCISES[id]
  if (!ex) throw new Error(`Unknown exercise: ${id}`)
  return ex
}
