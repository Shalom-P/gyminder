import type { Exercise } from '../types'

/**
 * Curated, evidence-based exercise pool. Rep ranges follow current consensus:
 * compounds ~6-8, accessories ~8-12, isolation ~12-20. `substitutions` are
 * ordered so the first entry is the closest lower-equipment alternative,
 * which lets the equipment + skip-swap resolver always find a doable lift.
 */
const list: Exercise[] = [
  // ---- Chest ----
  { id: 'bb_bench', name: 'Barbell Bench Press', primary: 'chest', type: 'compound', equipment: 'full', sets: 4, repMin: 6, repMax: 8, substitutions: ['db_bench', 'pushup'] },
  { id: 'db_bench', name: 'Dumbbell Bench Press', primary: 'chest', type: 'compound', equipment: 'dumbbell', sets: 4, repMin: 8, repMax: 10, substitutions: ['bb_bench', 'pushup'] },
  { id: 'incline_db', name: 'Incline Dumbbell Press', primary: 'chest', type: 'accessory', equipment: 'dumbbell', sets: 3, repMin: 8, repMax: 12, substitutions: ['incline_bb', 'pushup'] },
  { id: 'incline_bb', name: 'Incline Barbell Press', primary: 'chest', type: 'accessory', equipment: 'full', sets: 3, repMin: 6, repMax: 10, substitutions: ['incline_db', 'pushup'] },
  { id: 'pushup', name: 'Push-Up', primary: 'chest', type: 'compound', equipment: 'bodyweight', sets: 3, repMin: 12, repMax: 20, substitutions: ['db_bench'] },
  { id: 'cable_fly', name: 'Cable Fly', primary: 'chest', type: 'isolation', equipment: 'full', sets: 3, repMin: 12, repMax: 15, substitutions: ['db_fly', 'pushup'] },
  { id: 'db_fly', name: 'Dumbbell Fly', primary: 'chest', type: 'isolation', equipment: 'dumbbell', sets: 3, repMin: 12, repMax: 15, substitutions: ['cable_fly', 'pushup'] },

  // ---- Back ----
  { id: 'deadlift', name: 'Deadlift', primary: 'back', type: 'compound', equipment: 'full', sets: 3, repMin: 5, repMax: 6, substitutions: ['rdl', 'db_rdl'] },
  { id: 'pullup', name: 'Pull-Up', primary: 'back', type: 'compound', equipment: 'bodyweight', sets: 4, repMin: 6, repMax: 12, substitutions: ['lat_pulldown', 'db_row'] },
  { id: 'lat_pulldown', name: 'Lat Pulldown', primary: 'back', type: 'compound', equipment: 'full', sets: 4, repMin: 8, repMax: 12, substitutions: ['pullup', 'db_row'] },
  { id: 'bb_row', name: 'Barbell Row', primary: 'back', type: 'compound', equipment: 'full', sets: 4, repMin: 6, repMax: 10, substitutions: ['db_row', 'inv_row'] },
  { id: 'db_row', name: 'One-Arm Dumbbell Row', primary: 'back', type: 'accessory', equipment: 'dumbbell', sets: 3, repMin: 8, repMax: 12, substitutions: ['bb_row', 'inv_row'] },
  { id: 'inv_row', name: 'Inverted Row', primary: 'back', type: 'accessory', equipment: 'bodyweight', sets: 3, repMin: 10, repMax: 15, substitutions: ['db_row'] },
  { id: 'cable_row', name: 'Seated Cable Row', primary: 'back', type: 'accessory', equipment: 'full', sets: 3, repMin: 10, repMax: 12, substitutions: ['db_row', 'inv_row'] },
  { id: 'face_pull', name: 'Face Pull', primary: 'back', type: 'isolation', equipment: 'full', sets: 3, repMin: 15, repMax: 20, substitutions: ['rear_delt_fly'] },

  // ---- Shoulders ----
  { id: 'ohp', name: 'Overhead Press', primary: 'shoulders', type: 'compound', equipment: 'full', sets: 4, repMin: 6, repMax: 8, substitutions: ['db_ohp', 'pike_pushup'] },
  { id: 'db_ohp', name: 'Dumbbell Shoulder Press', primary: 'shoulders', type: 'compound', equipment: 'dumbbell', sets: 4, repMin: 8, repMax: 10, substitutions: ['ohp', 'pike_pushup'] },
  { id: 'pike_pushup', name: 'Pike Push-Up', primary: 'shoulders', type: 'accessory', equipment: 'bodyweight', sets: 3, repMin: 8, repMax: 15, substitutions: ['db_ohp'] },
  { id: 'lat_raise', name: 'Lateral Raise', primary: 'shoulders', type: 'isolation', equipment: 'dumbbell', sets: 3, repMin: 12, repMax: 20, substitutions: ['cable_lat_raise'] },
  { id: 'cable_lat_raise', name: 'Cable Lateral Raise', primary: 'shoulders', type: 'isolation', equipment: 'full', sets: 3, repMin: 12, repMax: 20, substitutions: ['lat_raise'] },
  { id: 'rear_delt_fly', name: 'Rear Delt Fly', primary: 'shoulders', type: 'isolation', equipment: 'dumbbell', sets: 3, repMin: 15, repMax: 20, substitutions: ['face_pull'] },

  // ---- Quads / Legs ----
  { id: 'squat', name: 'Barbell Back Squat', primary: 'quads', type: 'compound', equipment: 'full', sets: 4, repMin: 5, repMax: 8, substitutions: ['goblet_squat', 'bw_squat'] },
  { id: 'goblet_squat', name: 'Goblet Squat', primary: 'quads', type: 'compound', equipment: 'dumbbell', sets: 3, repMin: 8, repMax: 12, substitutions: ['squat', 'bw_squat'] },
  { id: 'bw_squat', name: 'Bodyweight Squat', primary: 'quads', type: 'accessory', equipment: 'bodyweight', sets: 3, repMin: 15, repMax: 25, substitutions: ['goblet_squat'] },
  { id: 'leg_press', name: 'Leg Press', primary: 'quads', type: 'compound', equipment: 'full', sets: 3, repMin: 8, repMax: 12, substitutions: ['goblet_squat', 'bw_squat'] },
  { id: 'lunge', name: 'Walking Lunge', primary: 'quads', type: 'accessory', equipment: 'dumbbell', sets: 3, repMin: 10, repMax: 12, substitutions: ['bw_lunge'] },
  { id: 'bw_lunge', name: 'Bodyweight Lunge', primary: 'quads', type: 'accessory', equipment: 'bodyweight', sets: 3, repMin: 12, repMax: 20, substitutions: ['lunge'] },
  { id: 'leg_ext', name: 'Leg Extension', primary: 'quads', type: 'isolation', equipment: 'full', sets: 3, repMin: 12, repMax: 15, substitutions: ['bw_squat'] },

  // ---- Hamstrings / Glutes ----
  { id: 'rdl', name: 'Romanian Deadlift', primary: 'hamstrings', type: 'compound', equipment: 'full', sets: 3, repMin: 8, repMax: 10, substitutions: ['db_rdl', 'hip_bridge'] },
  { id: 'db_rdl', name: 'Dumbbell RDL', primary: 'hamstrings', type: 'accessory', equipment: 'dumbbell', sets: 3, repMin: 10, repMax: 12, substitutions: ['rdl', 'hip_bridge'] },
  { id: 'leg_curl', name: 'Leg Curl', primary: 'hamstrings', type: 'isolation', equipment: 'full', sets: 3, repMin: 12, repMax: 15, substitutions: ['db_rdl', 'hip_bridge'] },
  { id: 'hip_thrust', name: 'Hip Thrust', primary: 'glutes', type: 'compound', equipment: 'full', sets: 3, repMin: 8, repMax: 12, substitutions: ['hip_bridge'] },
  { id: 'hip_bridge', name: 'Glute Bridge', primary: 'glutes', type: 'accessory', equipment: 'bodyweight', sets: 3, repMin: 15, repMax: 20, substitutions: ['hip_thrust'] },

  // ---- Biceps ----
  { id: 'bb_curl', name: 'Barbell Curl', primary: 'biceps', type: 'isolation', equipment: 'full', sets: 3, repMin: 8, repMax: 12, substitutions: ['db_curl', 'chin_up'] },
  { id: 'db_curl', name: 'Dumbbell Curl', primary: 'biceps', type: 'isolation', equipment: 'dumbbell', sets: 3, repMin: 8, repMax: 12, substitutions: ['bb_curl', 'chin_up'] },
  { id: 'hammer_curl', name: 'Hammer Curl', primary: 'biceps', type: 'isolation', equipment: 'dumbbell', sets: 3, repMin: 10, repMax: 12, substitutions: ['db_curl', 'chin_up'] },
  { id: 'chin_up', name: 'Chin-Up', primary: 'biceps', type: 'compound', equipment: 'bodyweight', sets: 3, repMin: 6, repMax: 10, substitutions: ['db_curl'] },

  // ---- Triceps ----
  { id: 'close_bench', name: 'Close-Grip Bench Press', primary: 'triceps', type: 'compound', equipment: 'full', sets: 3, repMin: 6, repMax: 10, substitutions: ['dip', 'diamond_pushup'] },
  { id: 'dip', name: 'Triceps Dip', primary: 'triceps', type: 'compound', equipment: 'bodyweight', sets: 3, repMin: 8, repMax: 15, substitutions: ['diamond_pushup', 'pushdown'] },
  { id: 'pushdown', name: 'Triceps Pushdown', primary: 'triceps', type: 'isolation', equipment: 'full', sets: 3, repMin: 12, repMax: 15, substitutions: ['db_skullcrusher', 'diamond_pushup'] },
  { id: 'db_skullcrusher', name: 'Dumbbell Skullcrusher', primary: 'triceps', type: 'isolation', equipment: 'dumbbell', sets: 3, repMin: 10, repMax: 12, substitutions: ['pushdown', 'diamond_pushup'] },
  { id: 'overhead_ext', name: 'Overhead Dumbbell Extension', primary: 'triceps', type: 'isolation', equipment: 'dumbbell', sets: 3, repMin: 10, repMax: 15, substitutions: ['pushdown', 'diamond_pushup'] },
  { id: 'diamond_pushup', name: 'Diamond Push-Up', primary: 'triceps', type: 'accessory', equipment: 'bodyweight', sets: 3, repMin: 10, repMax: 20, substitutions: ['pushdown'] },

  // ---- Core ----
  { id: 'plank', name: 'Plank', primary: 'core', type: 'isolation', equipment: 'bodyweight', sets: 3, repMin: 30, repMax: 60, unit: 'sec', substitutions: ['crunch'] },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', primary: 'core', type: 'isolation', equipment: 'bodyweight', sets: 3, repMin: 8, repMax: 15, substitutions: ['crunch'] },
  { id: 'crunch', name: 'Crunch', primary: 'core', type: 'isolation', equipment: 'bodyweight', sets: 3, repMin: 15, repMax: 25, substitutions: ['plank'] },
  { id: 'cable_crunch', name: 'Cable Crunch', primary: 'core', type: 'isolation', equipment: 'full', sets: 3, repMin: 12, repMax: 20, substitutions: ['crunch'] },

  // ---- Calves ----
  { id: 'calf_raise', name: 'Standing Calf Raise', primary: 'calves', type: 'isolation', equipment: 'full', sets: 4, repMin: 12, repMax: 20, substitutions: ['bw_calf_raise'] },
  { id: 'bw_calf_raise', name: 'Bodyweight Calf Raise', primary: 'calves', type: 'isolation', equipment: 'bodyweight', sets: 4, repMin: 15, repMax: 25, substitutions: ['calf_raise'] }
]

export const EXERCISES: Record<string, Exercise> = Object.fromEntries(
  list.map((e) => [e.id, e])
)

export function getExercise(id: string): Exercise {
  const ex = EXERCISES[id]
  if (!ex) throw new Error(`Unknown exercise: ${id}`)
  return ex
}
