/**
 * Deep coaching layer. Rich technique content is keyed by movement *pattern*
 * (so it stays accurate and non-repetitive across the ~50 exercises), while
 * per-exercise info adds the specifics: which pattern, secondary muscles,
 * difficulty, a one-line summary, an equipment note and a setup checklist.
 * The same `pattern` also drives the generated motion-graphic demo.
 */

export type Pattern =
  | 'squat'
  | 'hinge'
  | 'bench'
  | 'incline'
  | 'ohp'
  | 'pushup'
  | 'row'
  | 'pulldown'
  | 'pullup'
  | 'fly'
  | 'lateral'
  | 'lunge'
  | 'curl'
  | 'triceps'
  | 'dip'
  | 'hipthrust'
  | 'legext'
  | 'legcurl'
  | 'plank'
  | 'crunch'
  | 'legraise'
  | 'calf'

export interface PatternInfo {
  /** What a clean rep looks like, in order. */
  steps: string[]
  /** Cues that keep the rep safe and effective. */
  cues: string[]
  /** The mistakes that quietly stall progress or cause injury. */
  mistakes: string[]
  tempo: string
  breathing: string
}

export const PATTERNS: Record<Pattern, PatternInfo> = {
  squat: {
    steps: [
      'Stand mid-foot under the load, feet shoulder-width, toes slightly out.',
      'Brace your core hard and take a big breath into the belly.',
      'Sit down and back, knees tracking over toes, chest tall.',
      'Descend until hip crease is at or just below knee level.',
      'Drive through mid-foot and stand fully, squeezing glutes at the top.'
    ],
    cues: [
      'Spread the floor with your feet to keep knees out.',
      'Keep the bar/weight stacked over mid-foot the whole way.',
      'Brace as if about to be punched in the stomach.'
    ],
    mistakes: [
      'Knees caving inward under load.',
      'Heels lifting or weight shifting to the toes.',
      'Rounding the lower back at the bottom ("butt wink") from going too deep too soon.'
    ],
    tempo: '2s down, brief pause, controlled drive up.',
    breathing: 'Big breath at the top, hold through the rep, exhale past the hardest point.'
  },
  hinge: {
    steps: [
      'Load over mid-foot, feet hip-width, soft knees.',
      'Push hips back, keeping a long flat spine, until you feel a hamstring stretch.',
      'Keep the weight close to your legs the entire descent.',
      'Drive hips forward to stand, finishing tall with glutes squeezed.',
      'Do not lean back or hyperextend at the top.'
    ],
    cues: [
      'Think "push the hips to the wall behind you", not "bend down".',
      'Lats on: protect the bar path by keeping it dragging up the thighs.',
      'Neutral neck — eyes a few feet ahead on the floor.'
    ],
    mistakes: [
      'Turning it into a squat by bending the knees too much.',
      'Rounding the lower back.',
      'The weight drifting away from the body.'
    ],
    tempo: '2-3s eccentric, powerful but controlled concentric.',
    breathing: 'Brace and inhale at the top, hold through the lift, exhale at lockout.'
  },
  bench: {
    steps: [
      'Lie back with eyes under the bar, shoulder blades pinned down and back.',
      'Grip slightly wider than shoulders, wrists stacked over elbows.',
      'Unrack and lower the bar to the lower chest with a ~75° elbow angle.',
      'Touch the chest lightly, then press up and slightly back to lockout.'
    ],
    cues: [
      'Keep shoulder blades retracted — "bend the bar" to engage the lats.',
      'Drive your feet into the floor for a stable base.',
      'Forearms vertical at the bottom.'
    ],
    mistakes: [
      'Flaring elbows to 90° (shoulder strain).',
      'Bouncing the bar off the chest.',
      'Losing the upper-back tightness and shrugging.'
    ],
    tempo: '2s down, touch, press explosively.',
    breathing: 'Inhale on the way down, exhale through the press.'
  },
  incline: {
    steps: [
      'Set the bench to 30–45°, sit back with shoulder blades retracted.',
      'Lower the weight to the upper chest / collarbone line.',
      'Keep elbows tucked to roughly 60–75°.',
      'Press up and slightly back without losing back tightness.'
    ],
    cues: [
      'Lower the angle if you feel it only in the front delts.',
      'Keep wrists stacked over elbows.',
      'Squeeze the upper chest at the top.'
    ],
    mistakes: [
      'Bench angle too steep — turns it into a shoulder press.',
      'Bar drifting toward the face.',
      'Hips lifting off the bench.'
    ],
    tempo: '2-3s down, controlled press.',
    breathing: 'Inhale lowering, exhale pressing.'
  },
  ohp: {
    steps: [
      'Stand tall, weight at shoulder height, elbows slightly in front.',
      'Brace glutes and core to lock the ribcage down.',
      'Press straight overhead, moving the head "through the window" as the weight passes.',
      'Finish with biceps near ears, weight stacked over mid-foot.'
    ],
    cues: [
      'Squeeze glutes to stop the lower back arching.',
      'Bar/weights travel in a straight vertical line.',
      'Full lockout — shrug slightly at the top.'
    ],
    mistakes: [
      'Leaning back and pressing with the upper chest.',
      'Flaring elbows wide.',
      'Not finishing overhead (partial lockout).'
    ],
    tempo: '2s down, controlled press up.',
    breathing: 'Big breath braced, exhale at the top.'
  },
  pushup: {
    steps: [
      'Hands just outside shoulders, body in one straight line head-to-heels.',
      'Brace the core and squeeze glutes.',
      'Lower until the chest is a fist-height off the floor, elbows ~45°.',
      'Press back up and fully lock out, keeping the body rigid.'
    ],
    cues: [
      'Think "plank that moves" — no sagging hips.',
      'Elbows back at ~45°, not flared to 90°.',
      'Push the floor away at the top.'
    ],
    mistakes: [
      'Hips sagging or piking up.',
      'Partial range — not reaching the bottom.',
      'Head dropping / craning the neck.'
    ],
    tempo: '2s down, 1s up, no rest at the bottom.',
    breathing: 'Inhale down, exhale up.'
  },
  row: {
    steps: [
      'Hinge to ~45°, flat back, weight hanging with shoulders slightly protracted.',
      'Initiate by pulling the shoulder blade back and down.',
      'Drive the elbow toward the hip, weight to the lower ribs.',
      'Control the weight all the way back to a full stretch.'
    ],
    cues: [
      'Lead with the elbow, not the hand.',
      'Squeeze the shoulder blade at the top of each rep.',
      'Keep the torso angle fixed — no jerking upright.'
    ],
    mistakes: [
      'Using momentum / standing up to heave the weight.',
      'Shrugging the trap instead of rowing with the back.',
      'Cutting the range short at the bottom.'
    ],
    tempo: '1-2s pull, 2-3s controlled lower.',
    breathing: 'Exhale on the pull, inhale on the return.'
  },
  pulldown: {
    steps: [
      'Grip slightly wider than shoulders, sit tall with a slight lean back.',
      'Pull the shoulder blades down first, then drive elbows to the floor.',
      'Bring the bar/handle to the upper chest.',
      'Control the weight back up to a full overhead stretch.'
    ],
    cues: [
      'Think "elbows to the back pockets".',
      'Chest up and proud through the pull.',
      'Don’t let the shoulders shrug up at the top of the stretch.'
    ],
    mistakes: [
      'Leaning way back and turning it into a row.',
      'Using body swing for momentum.',
      'Pulling behind the neck.'
    ],
    tempo: '1-2s pull, 2-3s controlled return.',
    breathing: 'Exhale pulling down, inhale returning.'
  },
  pullup: {
    steps: [
      'Hang from the bar, shoulder-width grip, shoulders active (not fully relaxed).',
      'Pull the shoulder blades down, then drive elbows down and back.',
      'Pull until the chin clears the bar.',
      'Lower under control to a full hang.'
    ],
    cues: [
      'Start every rep by "putting the shoulders in the back pockets".',
      'Squeeze the bar and keep a hollow body (ribs down).',
      'Full range: chin over bar to dead hang.'
    ],
    mistakes: [
      'Kipping / swinging when not intended.',
      'Half reps — not reaching a full hang or full chin-over.',
      'Shoulders shrugging up at the bottom.'
    ],
    tempo: 'Controlled up, 2-3s lower.',
    breathing: 'Exhale on the way up, inhale on the way down.'
  },
  fly: {
    steps: [
      'Slight bend in the elbows, set and fixed for the whole set.',
      'Open the arms in a wide arc until you feel a chest stretch.',
      'Squeeze the chest to bring the hands together along the same arc.',
      'Keep the movement at the shoulder joint, not the elbow.'
    ],
    cues: [
      'Think "hug a big tree".',
      'Fixed elbow angle — flys are not presses.',
      'Lead the return with the chest, not the hands.'
    ],
    mistakes: [
      'Bending and straightening the elbows (turning it into a press).',
      'Going too heavy and over-stretching the shoulder.',
      'Losing the shoulder-blade set.'
    ],
    tempo: '3s open stretch, 1-2s squeeze.',
    breathing: 'Inhale opening, exhale squeezing.'
  },
  lateral: {
    steps: [
      'Slight forward lean, tiny bend in the elbows, weights at the sides.',
      'Lead with the elbows and raise the arms out to roughly shoulder height.',
      'Pause briefly at the top — imagine pouring water from the pinkies.',
      'Lower slowly under control; do not let them drop.'
    ],
    cues: [
      'Lead with the elbows, not the hands.',
      'Stop at shoulder height — higher just hits traps.',
      'Smooth, no swinging.'
    ],
    mistakes: [
      'Swinging with body English / momentum.',
      'Going too heavy and shrugging the traps.',
      'Letting gravity drop the weights on the way down.'
    ],
    tempo: '1-2s up, brief hold, 2-3s down.',
    breathing: 'Exhale raising, inhale lowering.'
  },
  lunge: {
    steps: [
      'Stand tall, core braced, take a controlled step.',
      'Lower until both knees are ~90°, front shin near vertical.',
      'Keep the torso upright; back knee travels toward the floor.',
      'Drive through the front mid-foot to return / step through.'
    ],
    cues: [
      'Most of the weight through the front heel/mid-foot.',
      'Torso tall and proud — slight forward lean only.',
      'Control the descent; don’t crash the back knee.'
    ],
    mistakes: [
      'Front knee caving inward.',
      'Tiny step that overloads the front knee.',
      'Leaning the torso too far forward.'
    ],
    tempo: '2s down, controlled drive up.',
    breathing: 'Inhale lowering, exhale driving up.'
  },
  curl: {
    steps: [
      'Stand tall, elbows pinned to your sides, weights at full stretch.',
      'Curl by flexing only at the elbow — upper arm stays still.',
      'Squeeze the biceps hard at the top.',
      'Lower slowly to a complete stretch (full elbow extension).'
    ],
    cues: [
      'Elbows stay glued to the ribs.',
      'Control the lower — the eccentric builds the most size.',
      'Full range: all the way down every rep.'
    ],
    mistakes: [
      'Swinging the weight up with the back/hips.',
      'Elbows drifting forward (turning it into a front raise).',
      'Half reps at the top, never reaching full stretch.'
    ],
    tempo: '1-2s up, hard squeeze, 3s down.',
    breathing: 'Exhale curling up, inhale lowering.'
  },
  triceps: {
    steps: [
      'Set the upper arm in position and keep it fixed for every rep.',
      'Extend the elbow to full lockout, squeezing the triceps.',
      'Pause briefly at full extension.',
      'Return under control to a deep stretch without moving the upper arm.'
    ],
    cues: [
      'Only the forearm moves — upper arm is locked in place.',
      'Full lockout and a hard triceps squeeze each rep.',
      'Control the stretch; don’t let the elbow flare.'
    ],
    mistakes: [
      'Upper arm drifting / using the shoulder to help.',
      'Going too heavy and shortening the range.',
      'Flaring elbows out wide.'
    ],
    tempo: '1-2s extend, 2-3s return.',
    breathing: 'Exhale extending, inhale returning.'
  },
  dip: {
    steps: [
      'Support yourself with locked arms, slight forward lean for chest emphasis.',
      'Lower until the upper arms are about parallel to the floor.',
      'Keep elbows tracking back at ~45°, not flaring wide.',
      'Press back up to a strong lockout.'
    ],
    cues: [
      'Stay tight — no loose swinging.',
      'More forward lean = chest, more upright = triceps.',
      'Stop at parallel; deeper stresses the shoulder.'
    ],
    mistakes: [
      'Going too deep and straining the shoulders.',
      'Flaring elbows wide.',
      'Bouncing out of the bottom.'
    ],
    tempo: '2-3s down, controlled press up.',
    breathing: 'Inhale down, exhale up.'
  },
  hipthrust: {
    steps: [
      'Upper back on a bench, feet flat, shins vertical at the top.',
      'Tuck the chin and brace; drive through the heels.',
      'Extend the hips until the torso and thighs form a straight line.',
      'Squeeze the glutes hard at the top, then lower under control.'
    ],
    cues: [
      'Posterior pelvic tilt at the top — "tuck the tailbone".',
      'Push through the heels, not the toes.',
      'Ribcage down — don’t arch the lower back to fake height.'
    ],
    mistakes: [
      'Hyperextending the lower back instead of using glutes.',
      'Shins not vertical at lockout (feet placement off).',
      'Partial lockout — not reaching full hip extension.'
    ],
    tempo: '1-2s up, 1-2s squeeze, 2s down.',
    breathing: 'Exhale driving up, inhale lowering.'
  },
  legext: {
    steps: [
      'Sit back into the pad, knees aligned with the machine pivot.',
      'Extend the knees to full (but not violently locked) extension.',
      'Pause and squeeze the quads at the top.',
      'Lower under control without letting the stack slam.'
    ],
    cues: [
      'Squeeze the quads hard at the top of every rep.',
      'Control the negative — no free-falling.',
      'Keep the hips down in the seat.'
    ],
    mistakes: [
      'Using momentum to kick the weight up.',
      'Slamming the stack on the way down.',
      'Partial range of motion.'
    ],
    tempo: '1-2s up, hold, 2-3s down.',
    breathing: 'Exhale extending, inhale lowering.'
  },
  legcurl: {
    steps: [
      'Align the knee with the machine pivot, ankles on the pad.',
      'Curl the heels toward the glutes by flexing the knees.',
      'Squeeze the hamstrings at peak contraction.',
      'Lower slowly to a full stretch.'
    ],
    cues: [
      'Keep the hips pressed into the pad.',
      'Slow, controlled — hamstrings respond to the eccentric.',
      'Full range without the hips popping up.'
    ],
    mistakes: [
      'Hips lifting off the pad.',
      'Jerky, momentum-driven reps.',
      'Cutting the stretch short.'
    ],
    tempo: '1-2s curl, 3s lower.',
    breathing: 'Exhale curling, inhale lowering.'
  },
  plank: {
    steps: [
      'Forearms under shoulders, body in one straight line.',
      'Brace the abs, squeeze glutes, tuck the ribs down.',
      'Hold the position without sagging or piking.',
      'Breathe shallowly but keep the brace.'
    ],
    cues: [
      'Squeeze glutes and quads to stay rigid.',
      'Neutral neck — look at the floor just ahead.',
      'Quality over time: stop when the brace breaks.'
    ],
    mistakes: [
      'Hips sagging toward the floor.',
      'Hips piking up into an easy A-frame.',
      'Holding the breath the entire time.'
    ],
    tempo: 'Hold for time with a constant hard brace.',
    breathing: 'Slow, shallow breaths while keeping the core tight.'
  },
  crunch: {
    steps: [
      'Lie back (or kneel at the cable), lower back lightly supported.',
      'Curl the ribcage toward the pelvis — spinal flexion, not a hip pull.',
      'Squeeze the abs hard at the top.',
      'Lower under control to a slight stretch.'
    ],
    cues: [
      'Think "shorten the distance from ribs to hips".',
      'Chin off the chest, no neck yanking.',
      'Slow and controlled — abs respond to tension, not speed.'
    ],
    mistakes: [
      'Pulling on the head/neck with the hands.',
      'Hip-flexor sit-up instead of an ab curl.',
      'Using momentum to bounce up.'
    ],
    tempo: '1-2s up, hard squeeze, 2-3s down.',
    breathing: 'Exhale fully crunching up, inhale lowering.'
  },
  legraise: {
    steps: [
      'Hang (or lie) with a slight posterior pelvic tilt to start.',
      'Raise the legs by curling the pelvis up, not just lifting the thighs.',
      'Bring the legs to at least parallel (or higher with control).',
      'Lower slowly; do not let the legs swing back.'
    ],
    cues: [
      'Initiate with the pelvis tilt, not the hip flexors.',
      'No swinging — pause if you start using momentum.',
      'Control the lower as much as the raise.'
    ],
    mistakes: [
      'Swinging the body for momentum.',
      'Only lifting with hip flexors (no pelvic curl).',
      'Dropping the legs uncontrolled.'
    ],
    tempo: '1-2s up, 2-3s down, no swing.',
    breathing: 'Exhale raising, inhale lowering.'
  },
  calf: {
    steps: [
      'Balls of the feet on the edge, heels free to drop.',
      'Lower the heels for a deep calf stretch.',
      'Drive up onto the toes as high as possible.',
      'Pause and squeeze hard at the top of every rep.'
    ],
    cues: [
      'Full range: deep stretch to a high, hard squeeze.',
      'Pause at the top — calves love the peak contraction.',
      'Slow and controlled, no bouncing.'
    ],
    mistakes: [
      'Bouncing on the tendon instead of muscle work.',
      'Tiny partial range of motion.',
      'Rushing — no pause or squeeze.'
    ],
    tempo: '2s up, 1-2s squeeze, 2-3s stretch down.',
    breathing: 'Exhale up, inhale down.'
  }
}

export interface ExerciseInfo {
  pattern: Pattern
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  secondary: string[]
  summary: string
  equipmentNote: string
  setup: string[]
}

export const EXERCISE_INFO: Record<string, ExerciseInfo> = {
  // Chest
  bb_bench: { pattern: 'bench', difficulty: 'Intermediate', secondary: ['Front delts', 'Triceps'], summary: 'The benchmark upper-body pressing strength builder.', equipmentNote: 'Barbell + flat bench, safeties/spotter recommended.', setup: ['Eyes under the bar, feet flat', 'Pinch shoulder blades, slight arch', 'Grip ~1.5x shoulder width'] },
  db_bench: { pattern: 'bench', difficulty: 'Beginner', secondary: ['Front delts', 'Triceps'], summary: 'Dumbbell press with a bigger stretch and even loading.', equipmentNote: 'Two dumbbells + flat bench.', setup: ['Kick dumbbells up to the shoulders', 'Shoulder blades retracted', 'Wrists stacked over elbows'] },
  incline_db: { pattern: 'incline', difficulty: 'Beginner', secondary: ['Front delts', 'Triceps'], summary: 'Builds the upper chest shelf.', equipmentNote: 'Two dumbbells + incline bench (30–45°).', setup: ['Set bench to ~30–45°', 'Dumbbells to shoulders', 'Retract shoulder blades'] },
  incline_bb: { pattern: 'incline', difficulty: 'Intermediate', secondary: ['Front delts', 'Triceps'], summary: 'Barbell upper-chest press for heavier loading.', equipmentNote: 'Barbell + incline bench.', setup: ['Bench ~30°', 'Eyes near the bar', 'Tight upper back'] },
  pushup: { pattern: 'pushup', difficulty: 'Beginner', secondary: ['Front delts', 'Triceps', 'Core'], summary: 'Scalable bodyweight chest and core builder.', equipmentNote: 'None.', setup: ['Hands just outside shoulders', 'Body in one line', 'Brace core + glutes'] },
  cable_fly: { pattern: 'fly', difficulty: 'Beginner', secondary: ['Front delts'], summary: 'Constant-tension chest isolation.', equipmentNote: 'Cable station, dual handles.', setup: ['Set pulleys ~chest height', 'Soft fixed elbow bend', 'Slight forward stagger'] },
  db_fly: { pattern: 'fly', difficulty: 'Intermediate', secondary: ['Front delts'], summary: 'Dumbbell chest stretch and isolation.', equipmentNote: 'Two light dumbbells + flat bench.', setup: ['Lie back, weights above chest', 'Set a fixed elbow bend', 'Shoulder blades pinned'] },
  // Back
  deadlift: { pattern: 'hinge', difficulty: 'Advanced', secondary: ['Glutes', 'Hamstrings', 'Traps', 'Core'], summary: 'The total-body posterior-chain strength lift.', equipmentNote: 'Barbell, plates to mid-shin height.', setup: ['Bar over mid-foot', 'Hinge and grip just outside knees', 'Chest up, lats tight, slack out of the bar'] },
  pullup: { pattern: 'pullup', difficulty: 'Advanced', secondary: ['Biceps', 'Rear delts', 'Core'], summary: 'King of bodyweight back-width movements.', equipmentNote: 'Pull-up bar.', setup: ['Shoulder-width overhand grip', 'Active hang, ribs down', 'Set shoulders before pulling'] },
  lat_pulldown: { pattern: 'pulldown', difficulty: 'Beginner', secondary: ['Biceps', 'Rear delts'], summary: 'Scalable vertical pull for back width.', equipmentNote: 'Lat pulldown machine.', setup: ['Thighs locked under the pad', 'Grip just wider than shoulders', 'Tall chest, slight lean back'] },
  bb_row: { pattern: 'row', difficulty: 'Intermediate', secondary: ['Rear delts', 'Biceps', 'Core'], summary: 'Heavy horizontal pull for back thickness.', equipmentNote: 'Barbell.', setup: ['Hinge to ~45°, flat back', 'Grip shoulder-width', 'Brace hard'] },
  db_row: { pattern: 'row', difficulty: 'Beginner', secondary: ['Rear delts', 'Biceps'], summary: 'Supported single-arm row for a big range of motion.', equipmentNote: 'Dumbbell + bench.', setup: ['One hand and knee on the bench', 'Flat back', 'Dumbbell hanging at full stretch'] },
  inv_row: { pattern: 'row', difficulty: 'Beginner', secondary: ['Rear delts', 'Biceps', 'Core'], summary: 'Bodyweight row; adjust angle for difficulty.', equipmentNote: 'Bar in a rack or rings.', setup: ['Lie under the bar', 'Grip shoulder-width', 'Body straight, heels down'] },
  cable_row: { pattern: 'row', difficulty: 'Beginner', secondary: ['Rear delts', 'Biceps'], summary: 'Constant-tension seated back builder.', equipmentNote: 'Seated cable row station.', setup: ['Soft knees, tall torso', 'Neutral handle', 'Slight forward reach to start'] },
  face_pull: { pattern: 'row', difficulty: 'Beginner', secondary: ['Traps', 'Biceps'], summary: 'Rear-delt and upper-back health builder.', equipmentNote: 'Cable + rope at face height.', setup: ['Rope at upper-chest/face height', 'Step back for tension', 'Thumbs back at the pull'] },
  // Shoulders
  ohp: { pattern: 'ohp', difficulty: 'Intermediate', secondary: ['Triceps', 'Upper chest', 'Core'], summary: 'Standing strict press — true overhead strength.', equipmentNote: 'Barbell.', setup: ['Bar on front delts', 'Elbows slightly ahead', 'Glutes + core braced'] },
  db_ohp: { pattern: 'ohp', difficulty: 'Beginner', secondary: ['Triceps', 'Core'], summary: 'Dumbbell overhead press, seated or standing.', equipmentNote: 'Two dumbbells.', setup: ['Weights at shoulder height', 'Wrists stacked over elbows', 'Ribcage down'] },
  pike_pushup: { pattern: 'pushup', difficulty: 'Intermediate', secondary: ['Triceps', 'Upper chest'], summary: 'Bodyweight progression toward overhead pressing.', equipmentNote: 'None (elevate feet to scale up).', setup: ['Pike hips high (inverted V)', 'Hands shoulder-width', 'Head between the hands path'] },
  lat_raise: { pattern: 'lateral', difficulty: 'Beginner', secondary: [], summary: 'The go-to side-delt width builder.', equipmentNote: 'Light dumbbells.', setup: ['Slight forward lean', 'Tiny fixed elbow bend', 'Weights at the sides'] },
  cable_lat_raise: { pattern: 'lateral', difficulty: 'Beginner', secondary: [], summary: 'Side delts under constant cable tension.', equipmentNote: 'Low cable + single handle.', setup: ['Cable from the low pulley behind you', 'Slight lean away', 'Soft elbow'] },
  rear_delt_fly: { pattern: 'fly', difficulty: 'Beginner', secondary: ['Traps'], summary: 'Targets the often-lagging rear delts.', equipmentNote: 'Light dumbbells (or cables).', setup: ['Hinge forward ~45°', 'Soft fixed elbows', 'Weights hanging below the chest'] },
  // Quads / Legs
  squat: { pattern: 'squat', difficulty: 'Advanced', secondary: ['Glutes', 'Hamstrings', 'Core'], summary: 'The foundational lower-body strength lift.', equipmentNote: 'Barbell + rack (safeties set).', setup: ['Bar on upper back, not the neck', 'Feet shoulder-width, toes slightly out', 'Brace before unracking'] },
  goblet_squat: { pattern: 'squat', difficulty: 'Beginner', secondary: ['Glutes', 'Core'], summary: 'Beginner-friendly squat that teaches an upright torso.', equipmentNote: 'One dumbbell or kettlebell.', setup: ['Hold the weight at the chest', 'Elbows inside the knees', 'Tall chest'] },
  bw_squat: { pattern: 'squat', difficulty: 'Beginner', secondary: ['Glutes', 'Core'], summary: 'No-equipment squat to groove the pattern.', equipmentNote: 'None.', setup: ['Feet shoulder-width', 'Arms out for counterbalance', 'Brace lightly'] },
  leg_press: { pattern: 'squat', difficulty: 'Beginner', secondary: ['Glutes', 'Hamstrings'], summary: 'Heavy quad loading with low stability demand.', equipmentNote: 'Leg press machine.', setup: ['Feet mid-platform, shoulder-width', 'Lower back flat on the pad', 'Release safeties before the first rep'] },
  lunge: { pattern: 'lunge', difficulty: 'Intermediate', secondary: ['Glutes', 'Hamstrings', 'Core'], summary: 'Unilateral leg builder that fixes imbalances.', equipmentNote: 'Two dumbbells (or bodyweight).', setup: ['Dumbbells at the sides', 'Tall posture', 'Eyes forward'] },
  bw_lunge: { pattern: 'lunge', difficulty: 'Beginner', secondary: ['Glutes', 'Core'], summary: 'Bodyweight unilateral leg work.', equipmentNote: 'None.', setup: ['Hands on hips', 'Tall posture', 'Controlled step length'] },
  leg_ext: { pattern: 'legext', difficulty: 'Beginner', secondary: [], summary: 'Isolated quad work and great finisher.', equipmentNote: 'Leg extension machine.', setup: ['Knee aligned with the pivot', 'Pad on the lower shin', 'Hold the handles'] },
  // Hamstrings / Glutes
  rdl: { pattern: 'hinge', difficulty: 'Intermediate', secondary: ['Glutes', 'Lower back'], summary: 'The premier hamstring stretch-and-strength builder.', equipmentNote: 'Barbell (or dumbbells).', setup: ['Stand tall holding the bar', 'Soft knees', 'Lats tight, bar against thighs'] },
  db_rdl: { pattern: 'hinge', difficulty: 'Beginner', secondary: ['Glutes', 'Lower back'], summary: 'Dumbbell hip hinge for hamstrings and glutes.', equipmentNote: 'Two dumbbells.', setup: ['Weights in front of the thighs', 'Soft knees', 'Flat back'] },
  leg_curl: { pattern: 'legcurl', difficulty: 'Beginner', secondary: ['Calves'], summary: 'Direct knee-flexion hamstring isolation.', equipmentNote: 'Seated or lying leg-curl machine.', setup: ['Knee aligned with the pivot', 'Pad just above the heels', 'Hips pinned to the pad'] },
  hip_thrust: { pattern: 'hipthrust', difficulty: 'Beginner', secondary: ['Hamstrings'], summary: 'The most direct glute strength and size builder.', equipmentNote: 'Barbell (padded) + bench.', setup: ['Shoulder blades on the bench edge', 'Bar over the hips, padded', 'Feet so shins are vertical at the top'] },
  hip_bridge: { pattern: 'hipthrust', difficulty: 'Beginner', secondary: ['Hamstrings'], summary: 'Floor glute bridge — perfect entry point.', equipmentNote: 'None.', setup: ['Lie on your back, knees bent', 'Heels close to the glutes', 'Arms flat for support'] },
  // Biceps
  bb_curl: { pattern: 'curl', difficulty: 'Beginner', secondary: ['Forearms'], summary: 'Classic mass-builder for the biceps.', equipmentNote: 'Barbell or EZ-bar.', setup: ['Shoulder-width grip', 'Elbows pinned to the sides', 'Stand tall, braced'] },
  db_curl: { pattern: 'curl', difficulty: 'Beginner', secondary: ['Forearms'], summary: 'Dumbbell curl allowing supination.', equipmentNote: 'Two dumbbells.', setup: ['Arms at the sides, palms forward at the top', 'Elbows pinned', 'Tall posture'] },
  hammer_curl: { pattern: 'curl', difficulty: 'Beginner', secondary: ['Forearms'], summary: 'Neutral-grip curl for the brachialis and forearms.', equipmentNote: 'Two dumbbells.', setup: ['Neutral (hammer) grip', 'Elbows pinned to the ribs', 'Tall posture'] },
  chin_up: { pattern: 'pullup', difficulty: 'Advanced', secondary: ['Back', 'Core'], summary: 'Underhand pull-up with heavy biceps involvement.', equipmentNote: 'Pull-up bar.', setup: ['Shoulder-width underhand grip', 'Active hang', 'Set shoulders before pulling'] },
  // Triceps
  close_bench: { pattern: 'bench', difficulty: 'Intermediate', secondary: ['Chest', 'Front delts'], summary: 'Press variation that overloads the triceps.', equipmentNote: 'Barbell + flat bench.', setup: ['Grip ~shoulder-width', 'Elbows tucked', 'Tight upper back'] },
  dip: { pattern: 'dip', difficulty: 'Intermediate', secondary: ['Chest', 'Front delts'], summary: 'Heavy bodyweight triceps and chest builder.', equipmentNote: 'Parallel dip bars.', setup: ['Support with locked arms', 'Slight lean for chest, upright for triceps', 'Brace core'] },
  pushdown: { pattern: 'triceps', difficulty: 'Beginner', secondary: [], summary: 'Constant-tension triceps isolation.', equipmentNote: 'Cable + bar/rope.', setup: ['Elbows pinned to the sides', 'Slight forward lean', 'Start at ~90° elbow'] },
  db_skullcrusher: { pattern: 'triceps', difficulty: 'Intermediate', secondary: [], summary: 'Lying extension hitting the long head.', equipmentNote: 'Two dumbbells + bench.', setup: ['Lie back, arms vertical', 'Upper arms fixed, slightly back', 'Neutral grip'] },
  overhead_ext: { pattern: 'triceps', difficulty: 'Beginner', secondary: [], summary: 'Overhead extension for a deep long-head stretch.', equipmentNote: 'One or two dumbbells.', setup: ['Weight overhead', 'Upper arms by the ears, fixed', 'Tall, braced torso'] },
  diamond_pushup: { pattern: 'pushup', difficulty: 'Intermediate', secondary: ['Chest', 'Front delts'], summary: 'Bodyweight push-up shifted onto the triceps.', equipmentNote: 'None.', setup: ['Hands together under the chest', 'Body in one line', 'Elbows track back, not flared'] },
  // Core
  plank: { pattern: 'plank', difficulty: 'Beginner', secondary: ['Glutes', 'Shoulders'], summary: 'Foundational anti-extension core brace.', equipmentNote: 'None.', setup: ['Forearms under the shoulders', 'Body in one straight line', 'Glutes + abs tight'] },
  hanging_leg_raise: { pattern: 'legraise', difficulty: 'Advanced', secondary: ['Hip flexors', 'Forearms'], summary: 'Advanced lower-ab and grip builder.', equipmentNote: 'Pull-up bar.', setup: ['Dead hang, shoulders active', 'Slight posterior pelvic tilt', 'No swing at the start'] },
  crunch: { pattern: 'crunch', difficulty: 'Beginner', secondary: [], summary: 'Direct spinal-flexion ab work.', equipmentNote: 'None (mat optional).', setup: ['Knees bent, lower back down', 'Hands light at the temples', 'Chin off the chest'] },
  cable_crunch: { pattern: 'crunch', difficulty: 'Beginner', secondary: [], summary: 'Loaded, progressible ab crunch.', equipmentNote: 'Cable + rope.', setup: ['Kneel facing the stack', 'Rope at the forehead', 'Hips fixed — only the spine flexes'] },
  // Calves
  calf_raise: { pattern: 'calf', difficulty: 'Beginner', secondary: [], summary: 'Loaded standing calf developer.', equipmentNote: 'Calf-raise machine or a step + load.', setup: ['Balls of the feet on the edge', 'Heels free to drop', 'Tall posture'] },
  bw_calf_raise: { pattern: 'calf', difficulty: 'Beginner', secondary: [], summary: 'No-equipment calf work; do high reps.', equipmentNote: 'A step or ledge.', setup: ['Balls of the feet on a step', 'Hold something for balance', 'Full stretch at the bottom'] }
}

export function getCoaching(id: string): ExerciseInfo | null {
  return EXERCISE_INFO[id] ?? null
}
