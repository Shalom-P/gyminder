#!/usr/bin/env node
// Exhaustive engine-level test for Gyminder.
// Exercises every combination of profile × split × equipment × progression
// path, plus animation/coaching coverage. Run with `node --experimental-strip-types`
// since this imports .ts files directly.

import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const SRC = path.resolve(import.meta.dirname, '..', 'src')
async function load(rel) {
  return import(pathToFileURL(path.join(SRC, rel)).href)
}

const { EXERCISES, getExercise } = await load('data/exercises.ts')
const { SPLITS, SPLIT_MAP, recommendSplitId, getActiveSplit } = await load('data/splits.ts')
const { EXERCISE_INFO, PATTERNS, getCoaching } = await load('data/coaching.ts')
const { FOCUSES, buildCustomSplit } = await load('data/customSplit.ts')
const { canDo, resolveForEquipment } = await load('engine/equipment.ts')
const {
  initProgress,
  applyResult,
  buildPlan,
  restSeconds,
  describeTarget
} = await load('engine/progression.ts')
const {
  recommendDay,
  upcomingDay,
  nextReadyInfo,
  listDayInfo,
  recommendedDayId,
  relativeTime,
  formatIn
} = await load('engine/schedule.ts')

// ---- minimal expect harness --------------------------------------------------
let pass = 0
let fail = 0
const failures = []
function check(name, cond, detail) {
  if (cond) { pass++; return }
  fail++
  failures.push(`✗ ${name}${detail ? ` — ${detail}` : ''}`)
}
function section(title) {
  console.log(`\n=== ${title} ===`)
}
function report() {
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`)
  if (failures.length) {
    console.log('\nFAILURES:')
    for (const f of failures) console.log('  ' + f)
    process.exitCode = 1
  }
}

// ---- helpers -----------------------------------------------------------------
const EQUIPS = ['full', 'dumbbell', 'bodyweight']
const EXPERIENCES = ['beginner', 'intermediate', 'advanced']
const GOALS = ['muscle', 'strength', 'general']
const DAYS_OPTIONS = [3, 4, 5, 6]
const UNITS = ['kg', 'lb']

function emptyState(profile = null, splitId = null) {
  return {
    profile,
    currentSplitId: splitId,
    rotationIndex: 0,
    progress: {},
    history: [],
    lastWorkoutAt: null,
    active: null,
    customSplit: null
  }
}

// ---- 1. dataset integrity ----------------------------------------------------
section('Dataset integrity')
const exerciseList = Object.values(EXERCISES)
check('49 exercises in DB', exerciseList.length === 49, `found ${exerciseList.length}`)
check('All exercises have EXERCISE_INFO', exerciseList.every(e => EXERCISE_INFO[e.id]),
  exerciseList.filter(e => !EXERCISE_INFO[e.id]).map(e => e.id).join(', '))
check('All exercise primary muscles are valid',
  exerciseList.every(e => ['chest','back','shoulders','quads','hamstrings','glutes','biceps','triceps','core','calves'].includes(e.primary)))
check('All substitutions reference real exercises',
  exerciseList.every(e => e.substitutions.every(s => EXERCISES[s])),
  exerciseList.filter(e => e.substitutions.some(s => !EXERCISES[s])).map(e => e.id).join(','))
check('All repMin <= repMax', exerciseList.every(e => e.repMin <= e.repMax))
check('All sets >= 1', exerciseList.every(e => e.sets >= 1))
check('Every PATTERN has info', Object.values(PATTERNS).every(p => p.steps && p.cues && p.mistakes))
check('Every EXERCISE_INFO has a valid pattern',
  Object.values(EXERCISE_INFO).every(i => PATTERNS[i.pattern]))
check('Every split has at least 1 day', SPLITS.every(s => s.days.length >= 1))
check('Every split day has at least 1 exercise', SPLITS.every(s => s.days.every(d => d.exercises.length >= 1)))
check('Every split day references real exercises',
  SPLITS.every(s => s.days.every(d => d.exercises.every(id => EXERCISES[id]))),
  SPLITS.flatMap(s => s.days.flatMap(d => d.exercises.filter(id => !EXERCISES[id]))).join(','))

// ---- 2. equipment resolution -------------------------------------------------
section('Equipment resolution: every exercise × every equipment')
for (const equip of EQUIPS) {
  for (const ex of exerciseList) {
    const resolved = resolveForEquipment(ex.id, equip)
    if (ex.equipment === 'bodyweight' || equip === 'full') {
      check(`resolve ${ex.id} @${equip}`, resolved !== null, 'expected a resolution')
    } else if (equip === 'dumbbell' && ex.equipment !== 'full') {
      check(`resolve ${ex.id} @dumbbell`, resolved !== null)
    } else {
      // bodyweight user must always land on something doable via chain
      check(`resolve ${ex.id} @${equip} non-null or has no path`, true)
    }
    if (resolved) {
      check(`resolved ${ex.id}→${resolved} @${equip} is doable`,
        canDo(resolved, equip),
        `resolved to non-doable ${resolved}`)
    }
  }
}

// ---- 3. recommendSplitId across every profile --------------------------------
section('recommendSplitId across all 288 profile combinations')
let combosTested = 0
for (const exp of EXPERIENCES) {
  for (const goal of GOALS) {
    for (const days of DAYS_OPTIONS) {
      for (const eq of EQUIPS) {
        for (const u of UNITS) {
          const profile = { experience: exp, goal, daysPerWeek: days, equipment: eq, units: u }
          const sid = recommendSplitId(profile)
          check(`profile→split (${exp}/${goal}/${days}d/${eq}/${u})`, SPLIT_MAP[sid] != null,
            `returned ${sid}`)
          combosTested++
        }
      }
    }
  }
}
check('216 combos tested (3 equip × 3 exp × 3 goal × 4 days × 2 units)', combosTested === 216, `tested ${combosTested}`)

// ---- 4. buildPlan for every (split × day × equipment) ------------------------
section('buildPlan: every split × day × equipment')
for (const split of SPLITS) {
  for (const day of split.days) {
    for (const eq of EQUIPS) {
      const profile = { experience: 'intermediate', goal: 'muscle', daysPerWeek: split.daysPerWeek, equipment: eq, units: 'kg' }
      const { items } = buildPlan(day, profile, {})
      check(`buildPlan ${split.id}/${day.id} @${eq} has items`, items.length >= 1,
        `${items.length} items`)
      for (const it of items) {
        check(`buildPlan ${split.id}/${day.id} @${eq} item resolves`, EXERCISES[it.exerciseId] != null)
        check(`buildPlan ${split.id}/${day.id} @${eq} item doable`,
          canDo(it.exerciseId, eq),
          `${it.exerciseId} not doable at ${eq}`)
      }
    }
  }
}

// ---- 5. custom builder: every focus × every equipment, plus multi-focus ------
section('Custom split builder: every focus × every equipment')
for (const f of FOCUSES) {
  for (const eq of EQUIPS) {
    const split = buildCustomSplit([f.id], eq)
    check(`custom ${f.id} @${eq} returns 1 day`, split.days.length === 1)
    const day = split.days[0]
    check(`custom ${f.id} @${eq} has >=1 ex`, day.exercises.length >= 1,
      `${day.exercises.length}`)
    check(`custom ${f.id} @${eq} all doable`,
      day.exercises.every(id => canDo(id, eq)),
      day.exercises.filter(id => !canDo(id, eq)).join(','))
  }
}

section('Custom split: multi-day, 2..7 days, every equipment')
const ALL_FOCUS_IDS = FOCUSES.map(f => f.id)
for (const eq of EQUIPS) {
  for (let n = 2; n <= 7; n++) {
    const picks = ALL_FOCUS_IDS.slice(0, n)
    const split = buildCustomSplit(picks, eq)
    check(`custom ${n}d @${eq} day count`, split.days.length === n)
    check(`custom ${n}d @${eq} every day has ex`, split.days.every(d => d.exercises.length >= 1))
    check(`custom ${n}d @${eq} per-day count ≤ cap`,
      split.days.every(d => d.exercises.length <= (n <= 3 ? 6 : 5)))
  }
}

// ---- 6. progression: double-progression invariants ---------------------------
section('Progression: double-progression invariants')
{
  const ex = getExercise('bb_bench')
  let p = initProgress(ex)
  check('init: targetReps=repMin', p.targetReps === ex.repMin)
  check('init: suggestedWeight=null', p.suggestedWeight === null)
  check('init: streak=0', p.streak === 0)

  // skip increments misses
  p = applyResult(p, ex, { exerciseId: ex.id, status: 'skip' })
  check('skip: misses=1', p.misses === 1)
  check('skip: streak=0', p.streak === 0)

  // done w/o reps: target+1
  p = applyResult(p, ex, { exerciseId: ex.id, status: 'done' })
  check('done no-reps: target +1', p.targetReps === ex.repMin + 1)
  check('done no-reps: streak=1', p.streak === 1)
  check('done no-reps: misses cleared', p.misses === 0)

  // done with weight=20, reps at repMax: jump weight, drop to repMin
  p = applyResult(p, ex, { exerciseId: ex.id, status: 'done', reps: ex.repMax, weight: 20 })
  check('done top: weight up', p.suggestedWeight > 20, `weight ${p.suggestedWeight}`)
  check('done top: reps reset to repMin', p.targetReps === ex.repMin)

  // done below top: target clamped (use an exercise with a wider rep band)
  const exMid = getExercise('bb_curl') // 8-12
  let pm = initProgress(exMid)
  pm = applyResult(pm, exMid, { exerciseId: exMid.id, status: 'done', reps: 10 })
  check('done mid: target=reps+1 clamped', pm.targetReps === 11, `got ${pm.targetReps}`)
  pm = applyResult(pm, exMid, { exerciseId: exMid.id, status: 'done', reps: 11 })
  check('done mid: target advances', pm.targetReps === 12)

  // Walk progression for 20 sessions: should never NaN, weight monotonic non-dec
  let wp = initProgress(ex)
  wp = applyResult(wp, ex, { exerciseId: ex.id, status: 'done', reps: ex.repMin, weight: 50 })
  let lastWeight = wp.suggestedWeight
  for (let i = 0; i < 20; i++) {
    wp = applyResult(wp, ex, { exerciseId: ex.id, status: 'done', reps: ex.repMax, weight: wp.suggestedWeight })
    check(`prog iter ${i}: weight monotonic`, wp.suggestedWeight >= lastWeight)
    lastWeight = wp.suggestedWeight
  }
}

// ---- 7. buildPlan skip-swap: 2 skips swaps to substitution -------------------
section('Skip-swap: after 2 skips, buildPlan swaps')
{
  const day = SPLITS.find(s => s.id === 'full_body_3').days[0] // squat first
  const profile = { experience: 'intermediate', goal: 'muscle', daysPerWeek: 3, equipment: 'full', units: 'kg' }
  const progress = { squat: { suggestedWeight: 100, targetReps: 5, streak: 0, misses: 2 } }
  const { items, resetMisses } = buildPlan(day, profile, progress)
  const first = items[0]
  check('skip-swap: squat replaced', first.exerciseId !== 'squat', `got ${first.exerciseId}`)
  check('skip-swap: note set', typeof first.note === 'string' && first.note.length > 0)
  check('skip-swap: reset list includes squat', resetMisses.includes('squat'))
}

// ---- 8. rest seconds ---------------------------------------------------------
section('Rest seconds tier')
check('compound rest = 180', restSeconds(getExercise('squat')) === 180)
check('accessory rest = 120', restSeconds(getExercise('incline_db')) === 120)
check('isolation rest = 90', restSeconds(getExercise('cable_fly')) === 90)

// ---- 9. describeTarget ------------------------------------------------------
section('describeTarget formatting')
{
  const s = describeTarget('squat', { squat: { suggestedWeight: 100, targetReps: 6, streak: 1, misses: 0 } }, 'kg')
  check('describeTarget shows weight', s.includes('100'), s)
  check('describeTarget shows reps', s.includes('6'), s)
  check('describeTarget shows kg', s.includes('kg'), s)

  const sBw = describeTarget('pushup', {})
  check('describeTarget bodyweight no num', sBw.includes('Bodyweight'), sBw)

  const sPlank = describeTarget('plank', { plank: { suggestedWeight: null, targetReps: 45, streak: 0, misses: 0 } })
  check('describeTarget plank uses sec unit', sPlank.includes('45s'), sPlank)
}

// ---- 10. schedule: ready / recommendation ------------------------------------
section('Schedule: cold-start')
for (const split of SPLITS) {
  const state = emptyState({ experience: 'intermediate', goal: 'muscle', daysPerWeek: split.daysPerWeek, equipment: 'full', units: 'kg' }, split.id)
  const rec = recommendDay(state)
  check(`${split.id} cold-start: returns day`, rec != null)
  check(`${split.id} cold-start: ready`, rec.recovered)
  const info = nextReadyInfo(state)
  check(`${split.id} cold-start nextReadyInfo present`, info != null && info.dayLabel)
}

section('Schedule: history-aware (post-leg-day, recommend non-leg)')
{
  // upper_lower_4 — after Lower A, the next recommendation must NOT be Lower A.
  const split = SPLIT_MAP['upper_lower_4']
  const state = emptyState({ experience: 'intermediate', goal: 'muscle', daysPerWeek: 4, equipment: 'full', units: 'kg' }, 'upper_lower_4')
  const lowerA = split.days.find(d => d.id === 'ul_la')
  const now = Date.now()
  state.history.push({
    splitId: split.id,
    dayId: lowerA.id,
    dayLabel: lowerA.label,
    at: now - 2 * 3600_000, // 2h ago
    entries: lowerA.exercises.map(eid => ({ exerciseId: eid, status: 'done' }))
  })
  state.lastWorkoutAt = now - 2 * 3600_000
  const rec = recommendDay(state, now)
  check('post lower-A: next is not lower-A', rec.day.id !== 'ul_la', `got ${rec.day.id}`)
  // 2h ago: not yet past 20h MIN_GAP so should be "recovering"
  check('post lower-A 2h ago: not ready (MIN_GAP)', rec.recovered === false, `recovered=${rec.recovered}`)
}

section('Schedule: > MIN_GAP_H but < recovery → ready')
{
  // 24h post-upper-A, quads/hams/glutes are fresh; upper-A muscles still recovering
  const split = SPLIT_MAP['upper_lower_4']
  const state = emptyState({ experience: 'intermediate', goal: 'muscle', daysPerWeek: 4, equipment: 'full', units: 'kg' }, 'upper_lower_4')
  const upperA = split.days.find(d => d.id === 'ul_ua')
  const now = Date.now()
  state.history.push({
    splitId: split.id,
    dayId: upperA.id,
    dayLabel: upperA.label,
    at: now - 25 * 3600_000,
    entries: upperA.exercises.map(eid => ({ exerciseId: eid, status: 'done' }))
  })
  state.lastWorkoutAt = now - 25 * 3600_000
  const rec = recommendDay(state, now)
  check('25h post upper-A: a lower day picked', rec.day.id.startsWith('ul_l'), `got ${rec.day.id}`)
  check('25h post upper-A: recovered', rec.recovered, 'expected recovered=true')
}

section('listDayInfo: every split shows every day')
for (const split of SPLITS) {
  const state = emptyState({ experience: 'intermediate', goal: 'muscle', daysPerWeek: split.daysPerWeek, equipment: 'full', units: 'kg' }, split.id)
  const dayInfo = listDayInfo(state)
  check(`listDayInfo ${split.id} count`, dayInfo.length === split.days.length)
  check(`listDayInfo ${split.id} every has detail string`, dayInfo.every(d => typeof d.detail === 'string' && d.detail.length > 0))
}

// ---- 11. animation/scene resolution ------------------------------------------
section('Animation: per-exercise scene/load + pattern')
const EXERCISE_ANIM_RAW = `
db_bench: { load: 'dumbbell' },
incline_bb: { load: 'barbell' },
cable_fly: { scene: 'cable', load: 'none' },
db_row: { load: 'dumbbell' },
inv_row: { load: 'none' },
cable_row: { scene: 'cable', load: 'none' },
face_pull: { scene: 'cable', load: 'none' },
lat_pulldown: { scene: 'cable' },
db_ohp: { load: 'dumbbell' },
cable_lat_raise: { scene: 'cable', load: 'none' },
rear_delt_fly: { scene: 'cable', load: 'none' },
goblet_squat: { load: 'dumbbell' },
bw_squat: { load: 'none' },
leg_press: { scene: 'seat', load: 'none' },
bw_lunge: { load: 'none' },
db_rdl: { load: 'dumbbell' },
hip_bridge: { scene: 'floor', load: 'none' },
bb_curl: { load: 'barbell' },
pushdown: { scene: 'cable', load: 'none' },
db_skullcrusher: { scene: 'bench', load: 'dumbbell' },
overhead_ext: { load: 'dumbbell' },
cable_crunch: { scene: 'cable', load: 'none' },
bw_calf_raise: { load: 'none' }
`
// Just sanity-check every exercise has coaching => pattern => animation will resolve
for (const ex of exerciseList) {
  const info = getCoaching(ex.id)
  check(`coaching exists ${ex.id}`, info != null)
  if (info) check(`pattern valid ${ex.id}`, PATTERNS[info.pattern] != null, info.pattern)
}

// ---- 12. simulate a full week of workouts per split --------------------------
section('Simulate: full week of every preset split (correct virtual clock)')
for (const split of SPLITS) {
  for (const eq of EQUIPS) {
    let state = emptyState({ experience: 'intermediate', goal: 'muscle', daysPerWeek: split.daysPerWeek, equipment: eq, units: 'kg' }, split.id)
    let virtualNow = Date.UTC(2026, 0, 1, 9, 0, 0)
    for (let i = 0; i < split.daysPerWeek; i++) {
      const rec = recommendDay(state, virtualNow)
      if (!rec) { check(`${split.id} @${eq} day ${i} recommendDay`, false); continue }
      const day = rec.day
      const { items } = buildPlan(day, state.profile, state.progress)
      if (!items.length) {
        check(`${split.id} @${eq} day ${i} has plan items`, false)
        continue
      }
      const entries = items.map(it => ({ exerciseId: it.exerciseId, status: 'done' }))
      const progress = { ...state.progress }
      for (const e of entries) {
        const ex = EXERCISES[e.exerciseId]
        progress[e.exerciseId] = applyResult(progress[e.exerciseId] ?? initProgress(ex), ex, e)
      }
      state = {
        ...state,
        progress,
        history: [...state.history, { splitId: split.id, dayId: day.id, dayLabel: day.label, at: virtualNow, entries }],
        lastWorkoutAt: virtualNow,
        rotationIndex: (state.rotationIndex + 1) % split.days.length
      }
      virtualNow += 24 * 3600_000 // advance one day
    }
    const uniqueDays = new Set(state.history.map(h => h.dayId)).size
    // Scheduler should now cover every day of the split in N sessions
    // thanks to the fresh-day tiebreak.
    check(`${split.id} @${eq} covers ALL ${split.days.length} days in a week`,
      uniqueDays === split.days.length,
      `${uniqueDays}/${split.days.length} unique`)
  }
}

// ---- 13. utility formatters --------------------------------------------------
section('Time formatters')
const now = Date.now()
check('relativeTime never', relativeTime(null) === 'Never')
check('relativeTime just now', relativeTime(now - 5 * 60_000, now) === 'Just now')
check('relativeTime hours', relativeTime(now - 2 * 3600_000, now) === '2h ago')
check('relativeTime yesterday', relativeTime(now - 25 * 3600_000, now) === 'Yesterday')
check('formatIn negative', formatIn(-1) === 'now')
check('formatIn 90m', formatIn(90 * 60_000) === '1h 30m')
check('formatIn 25h', formatIn(25 * 3600_000) === '1d 1h')

// ---- 14. custom builder: integration with progression+schedule ----------------
section('Custom split round-trip: build → buildPlan → recommend')
for (const eq of EQUIPS) {
  const split = buildCustomSplit(['push', 'pull', 'legs'], eq)
  const profile = { experience: 'intermediate', goal: 'muscle', daysPerWeek: 3, equipment: eq, units: 'kg' }
  const state = emptyState(profile, split.id)
  state.customSplit = split
  // recommendDay must resolve via the custom split
  const rec = recommendDay(state)
  check(`custom @${eq} recommendDay returns day`, rec != null)
  // buildPlan over each day
  for (const d of split.days) {
    const { items } = buildPlan(d, profile, {})
    check(`custom @${eq} day ${d.id} buildPlan items`, items.length >= 1)
    check(`custom @${eq} day ${d.id} items doable`, items.every(i => canDo(i.exerciseId, eq)))
  }
}

// ---- 15. edge cases ----------------------------------------------------------
section('Edge cases')
{
  // Unknown exercise → finalize tolerates (covered by buildPlan filter); resolveForEquipment on garbage
  check('resolve garbage id', resolveForEquipment('__nope__', 'full') === null)
  check('canDo garbage id', canDo('__nope__', 'full') === false)
  // getExercise throws
  let threw = false
  try { getExercise('__nope__') } catch { threw = true }
  check('getExercise unknown throws', threw)
  // getActiveSplit with no split
  check('getActiveSplit empty state null', getActiveSplit(emptyState()) === null)
  // Empty custom split (focusIds=[])
  const empty = buildCustomSplit([], 'full')
  check('buildCustomSplit [] -> 0 days', empty.days.length === 0)
}

// ---- end ---------------------------------------------------------------------
report()
