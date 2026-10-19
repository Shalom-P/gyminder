/**
 * Deep coaching layer. Rich technique content is keyed by movement *pattern*
 * (so it stays accurate and non-repetitive across the ~70 exercises), while
 * per-exercise info adds the specifics: which pattern, secondary muscles,
 * difficulty, a one-line summary, an equipment note, a setup checklist and —
 * where the shared pattern text would be wrong — its own technique.
 * The same `pattern` also drives the generated motion-graphic demo.
 */
import type { Exercise, Goal } from '../types'

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
  | 'pike'
  | 'facepull'
  | 'reardelt'
  | 'nordic'
  | 'slidecurl'

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
      'Bend hips and knees together, sitting down between your heels, knees tracking over your toes.',
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
      'Lie back with shoulder blades pinned down and back, feet flat on the floor.',
      'Hold the bar (or dumbbells) over your shoulders, wrists stacked over elbows.',
      'Lower under control to the lower chest, elbows about 45-70° from your sides.',
      'Touch lightly, then press up and slightly back to straight arms.'
    ],
    cues: [
      'Keep the shoulder blades retracted for the whole set.',
      'Drive your feet into the floor for a stable base.',
      'Forearms vertical at the bottom.'
    ],
    mistakes: [
      'Flaring the elbows straight out to 90° (strains the shoulder).',
      'Bouncing the weight off the chest.',
      'Losing upper-back tightness and shrugging toward the ears.'
    ],
    tempo: '2s down, touch, press with intent.',
    breathing: 'Inhale on the way down, exhale through the press.'
  },
  incline: {
    steps: [
      'Set the bench to about 30°, sit back with shoulder blades retracted.',
      'Lower the weight to the upper chest / collarbone line.',
      'Keep elbows tucked to roughly 60–75°.',
      'Press up and slightly back without losing back tightness.'
    ],
    cues: [
      'Around 30° hits the upper chest best; steeper shifts it to the front delts.',
      'Keep wrists stacked over elbows.',
      'Squeeze the upper chest at the top.'
    ],
    mistakes: [
      'Bench angle too steep (45° and up) — it turns into a shoulder press.',
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
      'Press straight up — with a bar, tip the head back slightly so it can pass, then bring it "through the window".',
      'Finish with arms straight and biceps near the ears, weight over mid-foot.'
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
      'Pause briefly at the top with thumbs level with the little fingers — no "pouring" rotation.',
      'Lower slowly under control; do not let them drop.'
    ],
    cues: [
      'Lead with the elbows, not the hands.',
      'About shoulder height is the useful range for the side delts.',
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
      'Control the lowering — don’t let gravity drop it.',
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
      'Line your knees up with the machine pivot, pad just above the heels; lock the thigh pad down.',
      'Curl your heels down and back as far as they go.',
      'Squeeze the hamstrings at full bend.',
      'Return slowly to straight legs for a full stretch.'
    ],
    cues: [
      'Sit tall and keep the thighs pinned — only the knees move.',
      'Slow, controlled lowering on every rep.',
      'Use the full range: straight legs to full bend.'
    ],
    mistakes: [
      'Hips or thighs lifting to cheat the weight.',
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
      'Keep breathing steadily behind the brace.'
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
    breathing: 'Slow, steady breaths without letting the brace go.'
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
  },
  pike: {
    steps: [
      'From a push-up, walk your feet in and lift your hips high into an inverted V.',
      'Hands just wider than shoulders; look back toward your feet.',
      'Bend the elbows to lower the top of your head toward the floor just ahead of your hands.',
      'Press back up to straight arms, keeping the hips high.'
    ],
    cues: [
      'Hips stay high — this is a shoulder press, not a push-up.',
      'Elbows track back at about 45°, not straight out.',
      'Feet on a step makes it harder; that is how you progress.'
    ],
    mistakes: [
      'Hips dropping into a push-up.',
      'Flaring the elbows wide.',
      'Stopping short instead of lowering the head toward the floor.'
    ],
    tempo: '2s down, controlled press up.',
    breathing: 'Inhale lowering, exhale pressing.'
  },
  facepull: {
    steps: [
      'Set a rope at upper-chest to face height and grip it with thumbs pointing back.',
      'Step back until your arms are straight with tension; stand tall.',
      'Pull the rope toward your face, spreading the ends apart as your elbows travel out and back.',
      'Finish with your hands beside your ears, forearms rotated up, then return under control.'
    ],
    cues: [
      'Elbows high — about shoulder level — the whole way.',
      'Squeeze the backs of the shoulders.',
      'Light weight, smooth reps.'
    ],
    mistakes: [
      'Leaning back to heave the weight.',
      'Shrugging the shoulders up.',
      'Going so heavy it turns into a row to the chest.'
    ],
    tempo: '1-2s pull, brief hold, 2s return.',
    breathing: 'Exhale pulling, inhale returning.'
  },
  reardelt: {
    steps: [
      'Hinge forward until your torso is nearly parallel to the floor (or lie chest-down on an incline bench).',
      'Let the weights hang under your shoulders, palms facing in, elbows softly bent.',
      'Raise your arms out to the sides until they are level with your body.',
      'Pause briefly, then lower slowly.'
    ],
    cues: [
      'Think "wide", not "back" — lead with the elbows.',
      'Keep the shoulder blades from bunching together so the rear delts do the work.',
      'Light weights, strict reps.'
    ],
    mistakes: [
      'Swinging the torso to throw the weights up.',
      'Squeezing the shoulder blades so the traps take over.',
      'Bending and straightening the elbows.'
    ],
    tempo: '1-2s up, brief hold, 2-3s down.',
    breathing: 'Exhale raising, inhale lowering.'
  },
  nordic: {
    steps: [
      'Kneel on a cushion with your ankles anchored under a heavy sofa or held by a partner.',
      'Make a straight line from knees to head, hips locked out, hands ready in front of you.',
      'Lean forward as slowly as you can, resisting with your hamstrings.',
      'When you can no longer hold it, catch yourself on your hands and push back up to the start.'
    ],
    cues: [
      'Hips stay straight — bend only at the knees.',
      'The slow lowering is the exercise; make it last 3-5 seconds.',
      'Start with 2 sets of a few reps: it causes heavy soreness at first.'
    ],
    mistakes: [
      'Bending at the hips to shorten the lever.',
      'Dropping through the last part of the range.',
      'Doing too much volume in the first weeks.'
    ],
    tempo: '3-5s lowering, use your hands to return.',
    breathing: 'Breathe steadily; exhale as you push back up.'
  },
  slidecurl: {
    steps: [
      'Lie on your back with your heels on a towel (smooth floor) or a stability ball, arms flat.',
      'Lift your hips into a bridge so your body makes a straight line.',
      'Keeping the hips up, pull your heels in toward your glutes.',
      'Slide the heels back out slowly to straight legs without dropping the hips.'
    ],
    cues: [
      'Hips stay high the whole set.',
      'Control the slide out — that is the hard part.',
      'Progress to one leg when 15 reps get easy.'
    ],
    mistakes: [
      'Hips sagging to the floor.',
      'Rushing the return.',
      'Arching the lower back instead of squeezing the glutes.'
    ],
    tempo: '1-2s curl in, 3s slide out.',
    breathing: 'Exhale curling in, inhale sliding out.'
  }
}

export interface ExerciseInfo {
  pattern: Pattern
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  secondary: string[]
  summary: string
  equipmentNote: string
  setup: string[]
  /** Exercise-specific technique where the shared pattern text would be wrong
   *  (a floor bridge is not a bench hip thrust; a pike push-up is not a push-up).
   *  Unset fields fall back to the pattern. */
  technique?: Partial<PatternInfo>
}

export const EXERCISE_INFO: Record<string, ExerciseInfo> = {
  // Chest
  bb_bench: { pattern: 'bench', difficulty: 'Intermediate', secondary: ['Front delts', 'Triceps'], summary: 'The benchmark upper-body pressing strength builder.', equipmentNote: 'Barbell + flat bench, with safeties or a spotter.', setup: ['Eyes under the bar, feet flat', 'Pinch shoulder blades, slight arch', 'Grip about 1.5× shoulder width'] },
  db_bench: { pattern: 'bench', difficulty: 'Beginner', secondary: ['Front delts', 'Triceps'], summary: 'Dumbbell press with a bigger stretch and even loading.', equipmentNote: 'Two dumbbells + flat bench. Expect ~15-20% less total load than the barbell.', setup: ['Kick the dumbbells up to your chest from your thighs', 'Shoulder blades retracted', 'Wrists stacked over elbows'] },
  machine_press: {
    pattern: 'bench', difficulty: 'Beginner', secondary: ['Front delts', 'Triceps'], summary: 'Stable, easy-to-load chest press — no spotter needed.', equipmentNote: 'Seated chest press machine.', setup: ['Seat height: handles at mid-chest', 'Back and shoulder blades on the pad', 'Feet flat'],
    technique: {
      steps: ['Adjust the seat so the handles line up with your mid-chest.', 'Sit tall with your back and shoulder blades against the pad.', 'Press the handles forward to straight arms without slamming into lockout.', 'Return under control until you feel a chest stretch.'],
      cues: ['Shoulder blades stay pinned to the pad.', 'Wrists straight, stacked behind the handles.', 'Control the return — never let the stack slam.'],
      mistakes: ['Seat set so the handles sit at the neck or belly.', 'Shoulders rolling forward at the end of the press.', 'Bouncing out of the bottom.']
    }
  },
  incline_db: { pattern: 'incline', difficulty: 'Beginner', secondary: ['Front delts', 'Triceps'], summary: 'Builds the upper chest.', equipmentNote: 'Two dumbbells + an adjustable bench set to about 30°.', setup: ['Set the bench to ~30°', 'Dumbbells to the shoulders', 'Retract shoulder blades'] },
  incline_bb: { pattern: 'incline', difficulty: 'Intermediate', secondary: ['Front delts', 'Triceps'], summary: 'Barbell upper-chest press for heavier loading.', equipmentNote: 'Barbell + incline bench, with safeties.', setup: ['Bench ~30°', 'Eyes near the bar', 'Tight upper back'] },
  pushup: { pattern: 'pushup', difficulty: 'Beginner', secondary: ['Front delts', 'Triceps', 'Core'], summary: 'Grows the chest as well as a bench press when sets are taken close to failure.', equipmentNote: 'None. Too hard? Use incline push-ups. Too easy? Elevate your feet.', setup: ['Hands just outside the shoulders', 'Body in one line', 'Brace core + glutes'] },
  pushup_incline: {
    pattern: 'pushup', difficulty: 'Beginner', secondary: ['Front delts', 'Triceps'], summary: 'The easier push-up — build up to the floor version.', equipmentNote: 'A bench, sturdy table or wall. The higher the hands, the easier it is.', setup: ['Hands on the edge, just outside the shoulders', 'Walk the feet back', 'Body in one line'],
    technique: {
      steps: ['Hands on a bench, sturdy table or wall, just outside shoulder width.', 'Walk your feet back until your body forms one straight line.', 'Lower your chest to the edge, elbows about 45° from your body.', 'Press back to straight arms. Lower the surface as you get stronger.']
    }
  },
  pushup_feet_elev: {
    pattern: 'pushup', difficulty: 'Intermediate', secondary: ['Front delts', 'Triceps', 'Upper chest'], summary: 'Harder push-up that shifts more load onto the arms and upper chest.', equipmentNote: 'A step, bench or chair for your feet.', setup: ['Feet on the step, hands on the floor', 'Hands just outside the shoulders', 'Body in one line'],
    technique: {
      steps: ['Feet on a step, bench or chair; hands on the floor just outside your shoulders.', 'Brace so your body is one straight line from head to heels.', 'Lower until your chest is a fist-height off the floor, elbows about 45°.', 'Press back to straight arms without letting the hips sag.']
    }
  },
  cable_fly: { pattern: 'fly', difficulty: 'Beginner', secondary: ['Front delts'], summary: 'Constant-tension chest isolation.', equipmentNote: 'Cable station, dual handles.', setup: ['Set pulleys at about chest height', 'Soft, fixed elbow bend', 'Slight forward stagger'] },
  db_fly: { pattern: 'fly', difficulty: 'Intermediate', secondary: ['Front delts'], summary: 'Dumbbell chest stretch and isolation.', equipmentNote: 'Two light dumbbells + flat bench.', setup: ['Lie back, weights above the chest', 'Set a fixed elbow bend', 'Shoulder blades pinned'] },
  // Back
  pullup: { pattern: 'pullup', difficulty: 'Advanced', secondary: ['Biceps', 'Rear delts', 'Core'], summary: 'The king of bodyweight back-width movements.', equipmentNote: 'Pull-up bar. Can’t do one yet? Swap to inverted rows or lat pulldowns.', setup: ['Shoulder-width overhand grip', 'Active hang, ribs down', 'Set the shoulders before pulling'] },
  lat_pulldown: { pattern: 'pulldown', difficulty: 'Beginner', secondary: ['Biceps', 'Rear delts'], summary: 'Scalable vertical pull for back width.', equipmentNote: 'Lat pulldown machine. Pull to the front — behind-the-neck adds risk, not muscle.', setup: ['Thighs locked under the pad', 'Grip just wider than shoulders', 'Tall chest, slight lean back'] },
  chin_up: { pattern: 'pullup', difficulty: 'Advanced', secondary: ['Biceps', 'Core'], summary: 'Underhand pull-up — a back builder with extra biceps work.', equipmentNote: 'Pull-up bar.', setup: ['Shoulder-width underhand grip', 'Active hang', 'Set the shoulders before pulling'] },
  bb_row: { pattern: 'row', difficulty: 'Intermediate', secondary: ['Rear delts', 'Biceps', 'Lower back'], summary: 'Heavy horizontal pull for back thickness.', equipmentNote: 'Barbell.', setup: ['Hinge to ~45°, flat back', 'Grip shoulder-width', 'Brace hard'] },
  db_row: {
    pattern: 'row', difficulty: 'Beginner', secondary: ['Rear delts', 'Biceps'], summary: 'Supported single-arm row for a big range of motion.', equipmentNote: 'Dumbbell + bench.', setup: ['One hand and knee on the bench', 'Flat back', 'Dumbbell hanging at full stretch'],
    technique: {
      steps: ['One hand and the same-side knee on a bench, back flat and roughly parallel to the floor.', 'Let the dumbbell hang at arm’s length under your shoulder.', 'Row it toward your hip, driving the elbow back.', 'Lower to a full stretch under control. Reps are per arm.']
    }
  },
  cs_db_row: {
    pattern: 'row', difficulty: 'Beginner', secondary: ['Rear delts', 'Biceps'], summary: 'Chest-supported row — the bench takes the lower back out of it.', equipmentNote: 'Two dumbbells + an incline bench.', setup: ['Bench at about 30-45°', 'Chest on the pad, feet braced', 'Dumbbells hanging under the shoulders'],
    technique: {
      steps: ['Lie chest-down on a bench set to about 30-45°, dumbbells hanging below your shoulders.', 'Row both dumbbells toward your hips, driving the elbows back.', 'Squeeze your shoulder blades together at the top.', 'Lower to a full stretch under control.'],
      cues: ['Chest stays on the pad — no heaving.', 'Lead with the elbows, not the hands.', 'The bench takes your lower back out of it.'],
      mistakes: ['Lifting the chest off the pad to cheat.', 'Shrugging toward the ears.', 'Cutting the stretch short.']
    }
  },
  cable_row: {
    pattern: 'row', difficulty: 'Beginner', secondary: ['Rear delts', 'Biceps'], summary: 'Constant-tension seated back builder.', equipmentNote: 'Seated cable row station.', setup: ['Feet on the platform, soft knees', 'Neutral handle', 'Sit tall'],
    technique: {
      steps: ['Sit tall with feet on the platform and knees soft; take the handle.', 'Start with straight arms, letting the shoulders reach forward slightly.', 'Pull the handle to your lower ribs, driving the elbows back.', 'Return under control to a full stretch without rounding your lower back.'],
      cues: ['Torso stays nearly upright — move the arms, not the body.', 'Lead with the elbows.', 'Pause briefly with the handle at your ribs.'],
      mistakes: ['Rocking the torso back and forth.', 'Shrugging the shoulders.', 'Cutting the stretch short.']
    }
  },
  inv_row: {
    pattern: 'row', difficulty: 'Beginner', secondary: ['Rear delts', 'Biceps', 'Core'], summary: 'Bodyweight row; walk your feet forward to make it harder.', equipmentNote: 'A bar at about waist height (in a rack or Smith machine) or rings.', setup: ['Lie under the bar', 'Grip just wider than shoulders', 'Body straight, heels down'],
    technique: {
      steps: ['Set a bar or rings at about waist height and lie underneath.', 'Grip just wider than shoulders, heels on the floor, body in one straight line.', 'Pull your chest to the bar, driving the elbows back.', 'Lower under control to straight arms.'],
      cues: ['Plank-rigid body — the hips don’t sag.', 'Squeeze your shoulder blades at the top.', 'More horizontal body = harder.'],
      mistakes: ['Hips sagging or piking.', 'Reaching with the chin instead of the chest.', 'Half reps.']
    }
  },
  table_row: {
    pattern: 'row', difficulty: 'Beginner', secondary: ['Rear delts', 'Biceps', 'Core'], summary: 'No-equipment back work: an inverted row under a sturdy table.', equipmentNote: 'A heavy, sturdy table — check it can’t tip before you start. (The demo shows the same row under a bar.)', setup: ['Test the table first', 'Chest under the edge', 'Grip the edge shoulder-width'],
    technique: {
      steps: ['Use a heavy, sturdy table and check it can’t tip before you start.', 'Lie under it with your chest below the edge; grip the edge about shoulder-width.', 'With heels on the floor and body straight, pull your chest up to the table.', 'Lower under control to straight arms.'],
      cues: ['Body stays plank-rigid.', 'Squeeze your shoulder blades at the top.', 'Bend your knees to make it easier.'],
      mistakes: ['Using a light or folding table that can tip or collapse.', 'Hips sagging.', 'Half reps.']
    }
  },
  // Shoulders
  ohp: { pattern: 'ohp', difficulty: 'Intermediate', secondary: ['Triceps', 'Upper chest', 'Core'], summary: 'Standing strict press — true overhead strength.', equipmentNote: 'Barbell + rack. Press in front of the head; behind-the-neck adds shoulder risk.', setup: ['Bar on the front delts', 'Elbows slightly ahead of the bar', 'Glutes + core braced'] },
  db_ohp: { pattern: 'ohp', difficulty: 'Beginner', secondary: ['Triceps', 'Core'], summary: 'Dumbbell overhead press, seated or standing.', equipmentNote: 'Two dumbbells.', setup: ['Weights at shoulder height', 'Wrists stacked over elbows', 'Ribcage down'] },
  pike_pushup: { pattern: 'pike', difficulty: 'Intermediate', secondary: ['Triceps', 'Upper chest'], summary: 'No-equipment overhead press for the shoulders.', equipmentNote: 'None. Put your feet on a step to progress.', setup: ['Hips high in an inverted V', 'Hands just wider than shoulders', 'Head between the hands'] },
  lat_raise: { pattern: 'lateral', difficulty: 'Beginner', secondary: [], summary: 'The best side-delt builder.', equipmentNote: 'Light dumbbells.', setup: ['Slight forward lean', 'Tiny fixed elbow bend', 'Weights at your sides'] },
  cable_lat_raise: { pattern: 'lateral', difficulty: 'Beginner', secondary: [], summary: 'Side delts under constant cable tension — grows them as well as dumbbells.', equipmentNote: 'Low cable + single handle.', setup: ['Cable from the low pulley across your body', 'Slight lean away', 'Soft elbow'] },
  face_pull: { pattern: 'facepull', difficulty: 'Beginner', secondary: ['Upper back', 'Rotator cuff'], summary: 'Rear-delt and upper-back work for healthy shoulders.', equipmentNote: 'Cable + rope at face height.', setup: ['Rope at upper-chest to face height', 'Step back for tension', 'Thumbs pointing back'] },
  rear_delt_fly: { pattern: 'reardelt', difficulty: 'Beginner', secondary: ['Upper back'], summary: 'Targets the often-lagging rear delts.', equipmentNote: 'Light dumbbells (an incline bench to lie on helps).', setup: ['Hinge forward until nearly parallel', 'Soft, fixed elbows', 'Weights hanging under the chest'] },
  prone_yt_raise: {
    pattern: 'reardelt', difficulty: 'Beginner', secondary: ['Upper back', 'Lower traps'], summary: 'No-equipment rear-delt and upper-back work.', equipmentNote: 'A mat. Light on its own — slow pauses make it work; hold water bottles to progress.', setup: ['Lie face down, forehead on a towel', 'Arms overhead in a Y', 'Thumbs pointing up'],
    technique: {
      steps: ['Lie face down, forehead resting on a folded towel, arms overhead in a Y with thumbs up.', 'Lift both arms as high as you can without arching your lower back; hold 2 seconds.', 'Lower, sweep the arms out to a T (thumbs still up) and lift again; hold.', 'Alternate Y and T; each pair is one rep.'],
      cues: ['Thumbs point to the ceiling the whole time.', 'Squeeze between and below the shoulder blades.', 'The pause at the top is what makes it hard.'],
      mistakes: ['Lifting the head and chest to fake height.', 'Shrugging toward the ears.', 'Rushing with no pause.'],
      tempo: '2s up, 2s hold, 2s down.'
    }
  },
  // Quads
  squat: { pattern: 'squat', difficulty: 'Advanced', secondary: ['Glutes', 'Adductors', 'Core'], summary: 'The foundational lower-body strength lift.', equipmentNote: 'Barbell + rack with safeties set.', setup: ['Bar on the upper back, not the neck', 'Feet shoulder-width, toes slightly out', 'Brace before unracking'] },
  leg_press: {
    pattern: 'squat', difficulty: 'Beginner', secondary: ['Glutes', 'Adductors'], summary: 'Heavy quad loading with low balance demand.', equipmentNote: 'Leg press machine.', setup: ['Feet mid-platform, shoulder-width', 'Lower back flat on the pad', 'Release the safeties before the first rep'],
    technique: {
      steps: ['Sit with your back and hips flat against the pad, feet shoulder-width in the middle of the platform.', 'Release the safeties and lower the platform under control until your knees reach about 90°, or just before your lower back starts to lift.', 'Press through the whole foot to just short of locking the knees.', 'Re-engage the safeties at the end of the set.'],
      cues: ['Lower back stays glued to the pad.', 'Knees track in line with the toes.', 'Control the descent — no bouncing.'],
      mistakes: ['Going so deep the hips curl off the pad.', 'Snapping the knees into lockout.', 'Heels lifting off the platform.']
    }
  },
  goblet_squat: { pattern: 'squat', difficulty: 'Beginner', secondary: ['Glutes', 'Core'], summary: 'Beginner-friendly squat that teaches an upright torso.', equipmentNote: 'One dumbbell or kettlebell.', setup: ['Hold the weight at the chest', 'Elbows inside the knees', 'Tall chest'] },
  bss: {
    pattern: 'lunge', difficulty: 'Intermediate', secondary: ['Glutes', 'Adductors'], summary: 'Single-leg squat that grows the legs as well as two-leg work — without a rack.', equipmentNote: 'Dumbbells + a bench behind you.', setup: ['Back foot laces-down on the bench', 'A long stride in front of it', 'Dumbbells at your sides'],
    technique: {
      steps: ['Stand a long stride in front of a bench and rest the top of your back foot on it; hold dumbbells at your sides.', 'Lower straight down until your front thigh is about parallel and the back knee nears the floor.', 'Keep your torso tall (a slight forward lean is fine), front knee tracking over your toes.', 'Drive through the front foot to stand. Reps are per leg.'],
      cues: ['Most of the weight stays on the front leg.', 'Find your stance before adding load.', 'Control the descent — no dropping into the bottom.'],
      mistakes: ['Stance too short, so the front heel lifts.', 'Front knee caving inward.', 'Pushing off the back foot.']
    }
  },
  bw_bss: {
    pattern: 'lunge', difficulty: 'Intermediate', secondary: ['Glutes', 'Adductors'], summary: 'The hardest no-equipment leg move — far more effective than air squats once those get easy.', equipmentNote: 'A chair, sofa or step behind you. (The demo shows the dumbbell version.)', setup: ['Back foot laces-down on the chair', 'A long stride in front of it', 'Hands on hips'],
    technique: {
      steps: ['Stand a long stride in front of a chair or step and rest the top of your back foot on it.', 'Lower straight down until your front thigh is about parallel and the back knee nears the floor.', 'Keep your torso tall, front knee tracking over your toes.', 'Drive through the front foot to stand. Reps are per leg.'],
      cues: ['Most of the weight stays on the front leg.', 'Too easy? Slow the lowering to 3 seconds or wear a loaded backpack.', 'Hold a wall lightly for balance at first.'],
      mistakes: ['Stance too short, so the front heel lifts.', 'Front knee caving inward.', 'Pushing off the back foot.']
    }
  },
  bw_squat: { pattern: 'squat', difficulty: 'Beginner', secondary: ['Glutes', 'Core'], summary: 'No-equipment squat to groove the pattern.', equipmentNote: 'None. Once 30 reps feel easy, move on to split squats.', setup: ['Feet shoulder-width', 'Arms out for counterbalance', 'Brace lightly'] },
  lunge: { pattern: 'lunge', difficulty: 'Intermediate', secondary: ['Glutes', 'Hamstrings', 'Core'], summary: 'Single-leg builder that evens out left-right imbalances.', equipmentNote: 'Two dumbbells.', setup: ['Dumbbells at your sides', 'Tall posture', 'Eyes forward. Reps are per leg'] },
  bw_lunge: { pattern: 'lunge', difficulty: 'Beginner', secondary: ['Glutes', 'Core'], summary: 'Bodyweight single-leg work.', equipmentNote: 'None.', setup: ['Hands on hips', 'Tall posture', 'Controlled step length. Reps are per leg'] },
  step_up: {
    pattern: 'lunge', difficulty: 'Beginner', secondary: ['Glutes', 'Hamstrings'], summary: 'Single-leg move with high glute activation.', equipmentNote: 'A sturdy step or chair, knee height or lower; dumbbells to progress.', setup: ['Face the step', 'Whole foot on top', 'Tall torso'],
    technique: {
      steps: ['Stand facing a sturdy step or chair, knee height or lower.', 'Place your whole foot on it and drive through that heel to stand up on top.', 'Step down slowly with the other leg, staying in control.', 'Do all reps on one leg, then switch.'],
      cues: ['Let the top leg do the work — don’t push off the floor foot.', 'Tall torso, slight forward lean.', 'Hold dumbbells to progress.'],
      mistakes: ['Bouncing off the bottom foot.', 'A step so high your hips tuck under.', 'Knee caving in on the way up.']
    }
  },
  leg_ext: { pattern: 'legext', difficulty: 'Beginner', secondary: [], summary: 'Isolated quad work — it trains the rectus femoris that squats and presses underwork.', equipmentNote: 'Leg extension machine.', setup: ['Knee aligned with the pivot', 'Pad on the lower shin', 'Hold the handles'] },
  // Hamstrings
  rdl: { pattern: 'hinge', difficulty: 'Intermediate', secondary: ['Glutes', 'Lower back'], summary: 'The premier hamstring stretch-and-strength builder.', equipmentNote: 'Barbell (or dumbbells).', setup: ['Stand tall holding the bar', 'Soft knees', 'Lats tight, bar against the thighs'] },
  db_rdl: { pattern: 'hinge', difficulty: 'Beginner', secondary: ['Glutes', 'Lower back'], summary: 'Dumbbell hip hinge for hamstrings and glutes.', equipmentNote: 'Two dumbbells.', setup: ['Weights in front of the thighs', 'Soft knees', 'Flat back'] },
  sl_rdl: {
    pattern: 'hinge', difficulty: 'Intermediate', secondary: ['Glutes', 'Core'], summary: 'Single-leg hinge — a real hamstring load with no equipment.', equipmentNote: 'None; hold a dumbbell or kettlebell in the opposite hand to load it.', setup: ['Stand on one leg, soft knee', 'Square the hips', 'A wall nearby for balance'],
    technique: {
      steps: ['Stand on one leg with a soft knee; hold a weight in the opposite hand if you have one.', 'Hinge forward at the hip, letting the free leg travel straight back as a counterweight.', 'Lower until you feel a strong hamstring stretch, hips square to the floor.', 'Drive the hip forward to stand tall. Reps are per leg.'],
      cues: ['Keep the hips level — don’t let the free side open up.', 'Reach the free heel back, not up.', 'Touch a wall lightly for balance at first.'],
      mistakes: ['Rounding the back to reach lower.', 'Hips twisting open.', 'Bending the standing knee into a squat.']
    }
  },
  leg_curl: { pattern: 'legcurl', difficulty: 'Beginner', secondary: ['Calves'], summary: 'Seated curls grow the hamstrings more than lying ones — the hip bend adds stretch.', equipmentNote: 'Seated leg curl machine.', setup: ['Knee aligned with the pivot', 'Pad just above the heels', 'Thigh pad locked down'] },
  lying_leg_curl: {
    pattern: 'legcurl', difficulty: 'Beginner', secondary: ['Calves'], summary: 'Lying knee-flexion hamstring isolation.', equipmentNote: 'Lying leg curl machine.', setup: ['Knees just off the bench edge', 'Pad just above the heels', 'Hips pressed into the pad'],
    technique: {
      steps: ['Lie face down with your knees just off the bench edge and the pad just above your heels.', 'Hold the handles and press your hips into the bench.', 'Curl your heels toward your glutes as far as they go.', 'Lower slowly to straight legs.'],
      cues: ['Hips stay pinned to the pad.', 'Slow lowering on every rep.', 'Use the full range: straight legs to full bend.'],
      mistakes: ['Hips lifting off the pad.', 'Jerky, momentum-driven reps.', 'Cutting the stretch short.']
    }
  },
  nordic: { pattern: 'nordic', difficulty: 'Advanced', secondary: ['Calves'], summary: 'A strongly evidenced hamstring builder — programmes that include it cut hamstring strains.', equipmentNote: 'Something to anchor your ankles: a heavy sofa or a partner. A cushion for the knees.', setup: ['Knees on a cushion', 'Ankles anchored', 'Hips straight, hands ready'] },
  slider_curl: { pattern: 'slidecurl', difficulty: 'Beginner', secondary: ['Glutes', 'Calves'], summary: 'No-machine knee-flexion work for the hamstrings.', equipmentNote: 'A towel on a smooth floor, or a stability ball.', setup: ['Lie on your back', 'Heels on the towel or ball', 'Arms flat for support'] },
  // Glutes
  deadlift: {
    pattern: 'hinge', difficulty: 'Advanced', secondary: ['Hamstrings', 'Lower back', 'Quads', 'Traps'], summary: 'The total-body pulling strength lift: glutes, hamstrings, back and quads together.', equipmentNote: 'Barbell, plates to mid-shin height. Progress the load conservatively.', setup: ['Bar over mid-foot', 'Hinge and grip just outside the knees', 'Chest up, lats tight, slack out of the bar'],
    technique: {
      steps: ['Stand with the bar over mid-foot, feet about hip-width.', 'Hinge down and grip just outside your knees; shins touch the bar.', 'Chest up, back flat: pull the slack out of the bar and brace.', 'Push the floor away, keeping the bar against your legs, and stand tall.', 'Lower by pushing the hips back, bending the knees once the bar passes them.'],
      cues: ['The bar stays in contact with your legs the whole way.', 'Hips and shoulders rise together off the floor.', 'Neutral neck — eyes a few feet ahead.'],
      mistakes: ['Rounding the lower back off the floor.', 'Jerking the bar instead of pulling the slack out first.', 'Leaning back at lockout.']
    }
  },
  hip_thrust: { pattern: 'hipthrust', difficulty: 'Beginner', secondary: ['Hamstrings'], summary: 'Direct glute strength and size builder.', equipmentNote: 'Barbell (padded) + bench.', setup: ['Shoulder blades on the bench edge', 'Bar over the hips, padded', 'Feet so the shins are vertical at the top'] },
  db_hip_thrust: {
    pattern: 'hipthrust', difficulty: 'Beginner', secondary: ['Hamstrings'], summary: 'Loaded hip thrust with one dumbbell.', equipmentNote: 'A dumbbell + a bench or sturdy sofa edge; a towel to pad it.', setup: ['Upper back on the bench edge', 'Dumbbell on the hip crease, padded', 'Feet flat, hip-width'],
    technique: {
      steps: ['Sit with your upper back against a bench edge and a padded dumbbell on your hip crease.', 'Feet flat, hip-width, so your shins are vertical at the top.', 'Drive through your heels to lift your hips until your torso and thighs are level.', 'Squeeze your glutes at the top, then lower under control.']
    }
  },
  sl_glute_bridge: {
    pattern: 'hipthrust', difficulty: 'Beginner', secondary: ['Hamstrings', 'Core'], summary: 'Single-leg bridge — doubles the load of the floor bridge.', equipmentNote: 'None.', setup: ['On your back, knees bent', 'One foot planted, the other lifted', 'Arms flat'],
    technique: {
      steps: ['Lie on your back with knees bent and feet flat; lift one foot and hold that knee up.', 'Drive through the heel of the planted foot to lift your hips.', 'Rise until shoulders, hips and knee form a line; squeeze the glute.', 'Lower under control. Reps are per leg.'],
      mistakes: ['Hips dropping or twisting toward the lifted side.', 'Pushing through the toes instead of the heel.', 'Arching the lower back to fake height.']
    }
  },
  hip_bridge: {
    pattern: 'hipthrust', difficulty: 'Beginner', secondary: ['Hamstrings'], summary: 'Floor glute bridge — the entry point.', equipmentNote: 'None. Once 25 reps feel easy, switch to single-leg bridges.', setup: ['Lie on your back, knees bent', 'Heels close to the glutes', 'Arms flat for support'],
    technique: {
      steps: ['Lie on your back, knees bent, feet flat about hip-width and close to your glutes.', 'Brace lightly and drive through your heels to lift your hips.', 'Rise until shoulders, hips and knees form a straight line; squeeze the glutes.', 'Lower under control and repeat.']
    }
  },
  // Biceps
  bb_curl: { pattern: 'curl', difficulty: 'Beginner', secondary: ['Forearms'], summary: 'Classic mass-builder for the biceps.', equipmentNote: 'Barbell or EZ-bar.', setup: ['Shoulder-width grip', 'Elbows pinned to the sides', 'Stand tall, braced'] },
  db_curl: { pattern: 'curl', difficulty: 'Beginner', secondary: ['Forearms'], summary: 'Dumbbell curl with a full twist of the palm.', equipmentNote: 'Two dumbbells.', setup: ['Arms at your sides, palms forward at the top', 'Elbows pinned', 'Tall posture'] },
  hammer_curl: { pattern: 'curl', difficulty: 'Beginner', secondary: ['Brachialis', 'Forearms'], summary: 'Neutral-grip curl for the brachialis and forearms.', equipmentNote: 'Two dumbbells.', setup: ['Neutral (hammer) grip', 'Elbows pinned to the ribs', 'Tall posture'] },
  // Triceps
  close_bench: {
    pattern: 'bench', difficulty: 'Intermediate', secondary: ['Chest', 'Front delts'], summary: 'Press variation that overloads the triceps.', equipmentNote: 'Barbell + flat bench, with safeties.', setup: ['Grip about shoulder-width', 'Elbows tucked', 'Tight upper back'],
    technique: {
      steps: ['Lie back with your eyes under the bar; grip about shoulder-width (no narrower).', 'Pin the shoulder blades and keep the elbows tucked close to your sides.', 'Lower the bar to the lower chest under control.', 'Press to straight arms, finishing with a hard triceps lockout.'],
      mistakes: ['Gripping so narrow it strains the wrists.', 'Elbows flaring out wide.', 'Bouncing the bar off the chest.']
    }
  },
  dip: { pattern: 'dip', difficulty: 'Intermediate', secondary: ['Chest', 'Front delts'], summary: 'Heavy bodyweight triceps and chest builder.', equipmentNote: 'Parallel dip bars. Avoid bench dips — they push the shoulder further back.', setup: ['Support yourself on locked arms', 'Slight lean for chest, upright for triceps', 'Brace the core'] },
  pushdown: { pattern: 'triceps', difficulty: 'Beginner', secondary: [], summary: 'Constant-tension triceps isolation.', equipmentNote: 'Cable + bar or rope.', setup: ['Elbows pinned to the sides', 'Slight forward lean', 'Start at about a 90° elbow'] },
  cable_oh_ext: { pattern: 'triceps', difficulty: 'Beginner', secondary: [], summary: 'Overhead triceps work — it grew the triceps more than arms-down extensions.', equipmentNote: 'Cable + rope.', setup: ['Face away from a low pulley', 'Rope behind your head, elbows by the ears', 'Staggered stance, braced torso'] },
  overhead_ext: { pattern: 'triceps', difficulty: 'Beginner', secondary: [], summary: 'Overhead extension — the stretched long head grows the most.', equipmentNote: 'One or two dumbbells.', setup: ['Weight overhead', 'Upper arms by the ears, fixed', 'Tall, braced torso'] },
  db_skullcrusher: { pattern: 'triceps', difficulty: 'Intermediate', secondary: [], summary: 'Lying extension with a deep long-head stretch.', equipmentNote: 'Two dumbbells + bench.', setup: ['Lie back, arms vertical', 'Upper arms fixed, slightly back', 'Neutral grip'] },
  diamond_pushup: {
    pattern: 'pushup', difficulty: 'Intermediate', secondary: ['Chest', 'Front delts'], summary: 'Bodyweight push-up shifted onto the triceps.', equipmentNote: 'None.', setup: ['Hands together under the chest', 'Body in one line', 'Elbows track back, not out'],
    technique: {
      steps: ['Hands together under your chest, thumbs and index fingers forming a diamond.', 'Body in one straight line from head to heels, core braced.', 'Lower your chest toward your hands, elbows tracking back close to your body.', 'Press back to straight arms with a hard triceps lockout.'],
      cues: ['Elbows back, not out.', 'Plank-tight body — no sagging hips.', 'Hands slightly wider if your wrists complain.'],
      mistakes: ['Hips sagging.', 'Elbows flaring wide.', 'Partial reps.']
    }
  },
  // Core
  plank: { pattern: 'plank', difficulty: 'Beginner', secondary: ['Glutes', 'Shoulders'], summary: 'Foundational anti-extension core brace.', equipmentNote: 'None. Past 60 s, make it harder instead of longer.', setup: ['Forearms under the shoulders', 'Body in one straight line', 'Glutes + abs tight'] },
  side_plank: {
    pattern: 'plank', difficulty: 'Beginner', secondary: ['Obliques', 'Glutes'], summary: 'Side-on core brace — part of the spine-sparing “Big 3”.', equipmentNote: 'None.', setup: ['On your side, forearm under the shoulder', 'Legs stacked (or knees bent: easier)', 'Hips in line'],
    technique: {
      steps: ['Lie on your side with your forearm under your shoulder, legs stacked (bend the knees to make it easier).', 'Lift your hips so your body forms a straight line from head to feet.', 'Hold without letting the hips sag or roll forward.', 'Switch sides; the time is per side.'],
      cues: ['Stack shoulder over elbow.', 'Squeeze the glutes and push the floor away.', 'Quality over time — stop when the line breaks.'],
      mistakes: ['Hips sagging toward the floor.', 'Rolling the chest toward the floor.', 'Holding the breath.']
    }
  },
  hanging_leg_raise: { pattern: 'legraise', difficulty: 'Advanced', secondary: ['Hip flexors', 'Forearms'], summary: 'Advanced lower-ab and grip builder.', equipmentNote: 'Pull-up bar.', setup: ['Dead hang, shoulders active', 'Slight posterior pelvic tilt', 'No swing at the start'] },
  reverse_crunch: {
    pattern: 'crunch', difficulty: 'Beginner', secondary: ['Hip flexors'], summary: 'One of the strongest ab activators tested — no bar needed.', equipmentNote: 'None (a mat helps).', setup: ['On your back, arms by your sides', 'Knees bent to 90°', 'Thighs vertical'],
    technique: {
      steps: ['Lie on your back, hands by your sides, knees bent to 90° with thighs vertical.', 'Curl your pelvis up off the floor, bringing your knees toward your chest.', 'Pause with the hips lifted, then lower slowly until your tailbone touches down.', 'Keep the knee angle fixed throughout.'],
      cues: ['It’s a pelvis curl, not a leg swing.', 'Arms press lightly into the floor for balance only.', 'Slow on the way down.'],
      mistakes: ['Swinging the legs for momentum.', 'Moving only the legs without lifting the hips.', 'Dropping the hips uncontrolled.'],
      tempo: '1-2s curl up, brief pause, 2-3s down.',
      breathing: 'Exhale curling up, inhale lowering.'
    }
  },
  crunch: { pattern: 'crunch', difficulty: 'Beginner', secondary: [], summary: 'Direct spinal-flexion ab work.', equipmentNote: 'None (mat optional). Keep volume moderate if your back is sensitive.', setup: ['Knees bent, lower back down', 'Hands light at the temples', 'Chin off the chest'] },
  cable_crunch: { pattern: 'crunch', difficulty: 'Beginner', secondary: [], summary: 'Loaded, progressible ab crunch.', equipmentNote: 'Cable + rope.', setup: ['Kneel facing the stack', 'Rope at the forehead', 'Hips fixed — only the spine flexes'] },
  // Calves
  calf_raise: { pattern: 'calf', difficulty: 'Beginner', secondary: [], summary: 'Loaded standing calf developer — standing beats seated for the calves.', equipmentNote: 'Standing calf machine (or a Smith machine + step).', setup: ['Balls of the feet on the edge', 'Heels free to drop', 'Tall posture'] },
  db_calf_raise: {
    pattern: 'calf', difficulty: 'Beginner', secondary: [], summary: 'Standing calf raise loaded with dumbbells.', equipmentNote: 'Dumbbells + a step.', setup: ['Balls of the feet on a step', 'Dumbbells at your sides', 'Hold something for balance'],
    technique: {
      steps: ['Stand with the balls of your feet on a step, dumbbells at your sides (or one dumbbell, one leg at a time).', 'Lower the heels for a deep calf stretch.', 'Drive up onto your toes as high as possible.', 'Pause and squeeze hard at the top of every rep.']
    }
  },
  sl_calf_raise: {
    pattern: 'calf', difficulty: 'Beginner', secondary: [], summary: 'The no-equipment calf builder — one leg doubles the load.', equipmentNote: 'A step, plus a wall or rail for balance.', setup: ['One foot on the step edge', 'Heel free to drop', 'Fingertips on a wall'],
    technique: {
      steps: ['Stand on one foot on the edge of a step, fingertips on a wall for balance.', 'Lower the heel for a deep calf stretch.', 'Drive up onto your toes as high as possible.', 'Pause at the top. Reps are per leg.']
    }
  },
  bw_calf_raise: { pattern: 'calf', difficulty: 'Beginner', secondary: [], summary: 'Two-leg calf raise; high reps. Move to single-leg once 30 is easy.', equipmentNote: 'A step or ledge.', setup: ['Balls of the feet on a step', 'Hold something for balance', 'Full stretch at the bottom'] }
}

export function getCoaching(id: string): ExerciseInfo | null {
  return EXERCISE_INFO[id] ?? null
}

/**
 * How hard to push each set, as reps in reserve (RIR). Growth improves as sets
 * end closer to failure, but going all the way adds fatigue without more
 * growth (Refalo et al. 2023, 2024; Robinson et al. 2024) and slows recovery
 * (Morán-Navarro et al. 2017); light loads only work when taken near failure
 * (Lasevicius et al. 2022). Heavy strength work stays further from failure.
 */
export function effortCue(ex: Exercise, goal?: Goal): string {
  if (ex.unit === 'sec') {
    return 'Hold with a hard brace until your form starts to slip — then stop.'
  }
  // Light bodyweight moves (push-ups, air squats) need to get near failure;
  // hard ones in the 5-12 rep range (pull-ups, dips, Nordics) are treated
  // like heavy lifts.
  if ((ex.equipment === 'bodyweight' || ex.equipment === 'none') && ex.repMax > 12) {
    return 'Take sets close to failure (0-2 good reps left): with body weight as the load, effort is what makes it work.'
  }
  if (ex.type === 'isolation') {
    return 'Finish sets close to failure, with 0-2 good reps left. The last set can go all the way.'
  }
  if (goal === 'strength') {
    return 'Leave 2-3 good reps in the tank on heavy sets — strength comes from crisp, heavy reps, not from grinding.'
  }
  return 'Stop each set with 1-3 good reps left. Grinding to failure adds fatigue, not muscle.'
}

/** Full technique for one exercise: its pattern's content plus any overrides. */
export function getTechnique(id: string): PatternInfo | null {
  const info = EXERCISE_INFO[id]
  if (!info) return null
  return { ...PATTERNS[info.pattern], ...info.technique }
}
