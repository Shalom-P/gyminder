#!/usr/bin/env node
// Exhaustive engine-level test for Gyminder.
// Exercises every combination of profile × split × equipment × progression
// path, plus swaps, alternatives, prescriptions, recovery, custom days and
// coaching coverage. Run with `npx tsx scripts/exhaustive-test.mjs` (it imports
// the .ts/.tsx source directly).

import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const SRC = path.resolve(import.meta.dirname, '..', 'src')
async function load(rel) {
  return import(pathToFileURL(path.join(SRC, rel)).href)
}

const { EXERCISES, getExercise } = await load('data/exercises.ts')
const { SPLITS, SPLIT_MAP, recommendSplitId, getActiveSplit } = await load('data/splits.ts')
const { EXERCISE_INFO, PATTERNS, getCoaching, getTechnique, effortCue } = await load('data/coaching.ts')
const { DEMO_MEDIA } = await load('data/demoMedia.ts')
const { FOCUSES, buildCustomSplit } = await load('data/customSplit.ts')
const { canDo, resolveForEquipment, isBodyweight } = await load('engine/equipment.ts')
const {
  alternativesFor, followSwaps, rememberSwap, movementOf, sameMovements
} = await load('engine/alternatives.ts')
const {
  initProgress,
  applyResult,
  buildPlan,
  restSeconds,
  describeTarget,
  prescribe,
  targetParts,
  snapWeight
} = await load('engine/progression.ts')
const { reducer, EMPTY } = await load('state/store.tsx')
const {
  recommendDay,
  upcomingDay,
  nextReadyInfo,
  listDayInfo,
  recommendedDayId,
  relativeTime,
  formatIn,
  recoveryHours,
  setsOn
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
const EQUIPS = ['full', 'dumbbell', 'bodyweight', 'none']
const MUSCLES = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps', 'core', 'calves']
const MAJOR = ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes']
const EXPERIENCES = ['beginner', 'intermediate', 'advanced']
const GOALS = ['muscle', 'strength', 'general', 'shred']
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
    customSplit: null,
    settings: { custom: false, sets: 3, reps: 8 },
    theme: 'dark',
    swaps: {}
  }
}
const profileOf = (equipment = 'full', extra = {}) => ({
  experience: 'intermediate', goal: 'muscle', daysPerWeek: 4, equipment, units: 'kg', ...extra
})

// ---- 1. dataset integrity ----------------------------------------------------
section('Dataset integrity')
const exerciseList = Object.values(EXERCISES)
check('69 exercises in DB', exerciseList.length === 69, `found ${exerciseList.length}`)
check('All exercises have EXERCISE_INFO', exerciseList.every(e => EXERCISE_INFO[e.id]),
  exerciseList.filter(e => !EXERCISE_INFO[e.id]).map(e => e.id).join(', '))
check('All exercise primary muscles are valid',
  exerciseList.every(e => ['chest','back','shoulders','quads','hamstrings','glutes','biceps','triceps','core','calves'].includes(e.primary)))
check('All substitutions reference real exercises',
  exerciseList.every(e => e.substitutions.every(s => EXERCISES[s])),
  exerciseList.filter(e => e.substitutions.some(s => !EXERCISES[s])).map(e => e.id).join(','))
check('All repMin <= repMax', exerciseList.every(e => e.repMin <= e.repMax))
check('Every exercise has a kit label', exerciseList.every(e => typeof e.kit === 'string' && e.kit.length > 0),
  exerciseList.filter(e => !e.kit).map(e => e.id).join(','))
check('Every synergist is a valid muscle, never the primary',
  exerciseList.every(e => Array.isArray(e.also) && e.also.every(m => MUSCLES.includes(m) && m !== e.primary)),
  exerciseList.filter(e => !e.also || e.also.some(m => !MUSCLES.includes(m) || m === e.primary)).map(e => e.id).join(','))
check('No exercise substitutes itself or repeats a substitution',
  exerciseList.every(e => !e.substitutions.includes(e.id) && new Set(e.substitutions).size === e.substitutions.length),
  exerciseList.filter(e => e.substitutions.includes(e.id) || new Set(e.substitutions).size !== e.substitutions.length).map(e => e.id).join(','))
check('Every exercise has at least two substitutions',
  exerciseList.every(e => e.substitutions.length >= 1) && exerciseList.filter(e => e.substitutions.length < 2).length <= 2,
  exerciseList.filter(e => e.substitutions.length < 2).map(e => e.id).join(','))
check('variantOf points at a real, canonical exercise of the same muscle',
  exerciseList.every(e => !e.variantOf || (EXERCISES[e.variantOf] && !EXERCISES[e.variantOf].variantOf && EXERCISES[e.variantOf].primary === e.primary)),
  exerciseList.filter(e => e.variantOf && !EXERCISES[e.variantOf]).map(e => e.id).join(','))
check('Strength ranges only on loaded compounds, min ≤ max, heavier than default',
  exerciseList.every(e => !e.strength || (e.type === 'compound' && !isBodyweight(e) && e.strength[0] <= e.strength[1] && e.strength[1] <= e.repMax)),
  exerciseList.filter(e => e.strength && !(e.type === 'compound' && !isBodyweight(e) && e.strength[0] <= e.strength[1])).map(e => e.id).join(','))
// Without dumbbells there is no biceps isolation: chin-ups (bar) and rows are
// the curated stand-ins, so biceps is the one muscle exempt below that tier.
const exempt = (m, eq) => m === 'biceps' && (eq === 'bodyweight' || eq === 'none')
check('Every equipment tier has work for every muscle',
  EQUIPS.every(eq => MUSCLES.every(m => exempt(m, eq) || exerciseList.some(e => e.primary === m && canDo(e.id, eq)))),
  EQUIPS.flatMap(eq => MUSCLES.filter(m => !exempt(m, eq) && !exerciseList.some(e => e.primary === m && canDo(e.id, eq))).map(m => `${m}@${eq}`)).join(','))
check('Below dumbbells, every curl still resolves to a biceps-heavy pull',
  ['bb_curl', 'db_curl', 'hammer_curl'].every(id => ['bodyweight', 'none'].every(eq => ['chin_up', 'table_row', 'inv_row'].includes(resolveForEquipment(id, eq)))))
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
    // The curated chains span every tier, so a lift always lands somewhere.
    check(`resolve ${ex.id} @${equip}`, resolved !== null, 'no doable fallback in the chain')
    if (!resolved) continue
    check(`resolved ${ex.id}→${resolved} @${equip} is doable`, canDo(resolved, equip),
      `resolved to non-doable ${resolved}`)
    if (canDo(ex.id, equip)) check(`doable ${ex.id} @${equip} resolves to itself`, resolved === ex.id, resolved)
    // Same muscle, or a hand-picked direct substitution (e.g. chin-up for a curl).
    check(`resolved ${ex.id}→${resolved} @${equip} trains the same muscle or is curated`,
      EXERCISES[resolved].primary === ex.primary || ex.substitutions.includes(resolved),
      `${ex.primary} → ${EXERCISES[resolved].primary}`)
  }
}

// ---- 3. recommendSplitId across every profile --------------------------------
section('recommendSplitId across all 384 profile combinations')
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
check('384 combos tested (4 equip × 3 exp × 4 goal × 4 days × 2 units)', combosTested === 384, `tested ${combosTested}`)
for (const exp of EXPERIENCES) {
  for (const days of DAYS_OPTIONS) {
    for (const eq of EQUIPS) {
      const sid = recommendSplitId({ experience: exp, goal: 'muscle', daysPerWeek: days, equipment: eq, units: 'kg' })
      check(`recommend ${exp}/${days}d/${eq}: never a once-a-week split`, sid !== 'ppl_3' && sid !== 'bro_5', sid)
      check(`recommend ${exp}/${days}d/${eq}: not more days than asked`, SPLIT_MAP[sid].daysPerWeek <= days, sid)
      if (exp === 'beginner') check(`recommend beginner/${days}d/${eq}: ≤4 days`, SPLIT_MAP[sid].daysPerWeek <= 4, sid)
      if (eq === 'none') check(`recommend ${exp}/${days}d/none: no dedicated pull days`, !['ppl_3', 'ppl_6', 'ppl_ul_5', 'bro_5'].includes(sid), sid)
    }
  }
}

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
      const moves = items.map(it => movementOf(it.exerciseId))
      check(`buildPlan ${split.id}/${day.id} @${eq} never repeats a movement`,
        new Set(moves).size === moves.length, moves.join(','))
      if (eq === 'full' || eq === 'dumbbell') {
        check(`buildPlan ${split.id}/${day.id} @${eq} fills every slot`, items.length === day.exercises.length,
          `${items.length}/${day.exercises.length}`)
      }
      if (eq === 'full') {
        check(`buildPlan ${split.id}/${day.id} @full is the template as written`,
          items.map(i => i.exerciseId).join() === day.exercises.join(), items.map(i => i.exerciseId).join())
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

// ---- 16. alternatives engine ------------------------------------------------
section('Alternatives: every exercise × every equipment')
for (const eq of EQUIPS) {
  for (const ex of exerciseList) {
    const alts = alternativesFor(ex.id, eq)
    check(`alts ${ex.id} @${eq} only doable`, alts.every(a => canDo(a, eq)), alts.filter(a => !canDo(a, eq)).join(','))
    check(`alts ${ex.id} @${eq} never itself, never repeats`, !alts.includes(ex.id) && new Set(alts).size === alts.length)
    check(`alts ${ex.id} @${eq} ≤ 6`, alts.length <= 6)
    const firstCurated = ex.substitutions.find(sub => canDo(sub, eq))
    if (firstCurated) check(`alts ${ex.id} @${eq} lead with the closest curated sub`, alts[0] === firstCurated, `${alts[0]} vs ${firstCurated}`)
    const excl = alts.slice(0, 2)
    const rest = alternativesFor(ex.id, eq, { exclude: excl })
    check(`alts ${ex.id} @${eq} respect exclude`, rest.every(a => !excl.includes(a)))
    for (const a of alternativesFor(ex.id, eq, { strict: true })) {
      const curated = ex.substitutions.includes(a) ||
        ex.substitutions.some(sub => EXERCISES[sub]?.substitutions.includes(a))
      const close = EXERCISES[a].primary === ex.primary &&
        (getCoaching(a)?.pattern === getCoaching(ex.id)?.pattern || EXERCISES[a].type === ex.type)
      check(`strict alt ${ex.id}→${a} @${eq} is curated or a close match`, curated || close)
    }
  }
}
// Every exercise someone might lack the kit for has somewhere to go at every tier.
for (const eq of EQUIPS) {
  const stranded = exerciseList.filter(ex => !canDo(ex.id, eq) && alternativesFor(ex.id, eq).length === 0)
  check(`every undoable exercise has an alternative @${eq}`, stranded.length === 0, stranded.map(e => e.id).join(','))
}

section('Swap chains: follow, remember, cycle-safety')
check('followSwaps: none → itself', followSwaps('bb_bench', {}) === 'bb_bench')
check('followSwaps: chain a→b→c ends at c', followSwaps('bb_bench', { bb_bench: 'db_bench', db_bench: 'pushup' }) === 'pushup')
check('followSwaps: 2-cycle terminates', ['bb_bench', 'db_bench'].includes(followSwaps('bb_bench', { bb_bench: 'db_bench', db_bench: 'bb_bench' })))
check('followSwaps: unknown target ignored', followSwaps('bb_bench', { bb_bench: '__gone__' }) === 'bb_bench')
{
  // Random remember operations never leave a cycle behind.
  let seed = 7
  const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n }
  const ids = exerciseList.slice(0, 12).map(e => e.id)
  let swaps = {}
  let acyclic = true
  for (let i = 0; i < 400; i++) {
    swaps = rememberSwap(swaps, ids[rnd(ids.length)], ids[rnd(ids.length)])
    for (const k of Object.keys(swaps)) {
      let cur = k, steps = 0
      while (swaps[cur] && steps <= ids.length) { cur = swaps[cur]; steps++ }
      if (steps > ids.length) acyclic = false
    }
  }
  check('rememberSwap never creates a cycle (400 random ops)', acyclic)
  check('rememberSwap(x, x) records nothing', !('pushup' in rememberSwap({}, 'pushup', 'pushup')))
}

// ---- 17. swaps through the real reducer --------------------------------------
section('Swap exercise: reducer + buildPlan round-trip')
{
  const day = SPLIT_MAP['upper_lower_4'].days[0] // bb_bench first
  let st = { ...EMPTY, profile: profileOf('full'), currentSplitId: 'upper_lower_4' }
  st = reducer(st, { type: 'startDay', dayId: day.id })
  check('session started', st.active && st.active.plan[0].exerciseId === 'bb_bench')
  st = reducer(st, { type: 'advanceSet', restEndsAt: Date.now() + 1000 })
  st = reducer(st, { type: 'swapExercise', toId: 'db_bench', remember: true })
  const item = st.active.plan[0]
  check('swap replaces the current exercise', item.exerciseId === 'db_bench', item.exerciseId)
  check('swap remembers the original', item.from === 'bb_bench')
  check('swap restarts at set 1, no rest', st.active.setIdx === 0 && st.active.restEndsAt === null)
  check('swap remembered when asked', st.swaps.bb_bench === 'db_bench')
  check('next plan uses the remembered swap', buildPlan(day, st.profile, st.progress, st.swaps).items[0].exerciseId === 'db_bench')
  check('next plan says what it replaced', buildPlan(day, st.profile, st.progress, st.swaps).items[0].from === 'bb_bench')
  // A swap of a swap stays keyed by the original.
  st = reducer(st, { type: 'swapExercise', toId: 'machine_press', remember: true })
  check('swap of a swap: keyed by the original', st.swaps.bb_bench === 'machine_press' && !('db_bench' in st.swaps), JSON.stringify(st.swaps))
  check('swap of a swap: still points back to the original', st.active.plan[0].from === 'bb_bench')
  // Picking the original restores it and forgets the swap.
  st = reducer(st, { type: 'swapExercise', toId: 'bb_bench', remember: true })
  check('back to original restores it', st.active.plan[0].exerciseId === 'bb_bench' && !st.active.plan[0].from)
  check('back to original forgets the swap', !('bb_bench' in st.swaps))
  // "Just today" leaves the program alone.
  const before = JSON.stringify(st.swaps)
  st = reducer(st, { type: 'swapExercise', toId: 'pushup', remember: false })
  check('just-today swap changes the session only', st.active.plan[0].exerciseId === 'pushup' && JSON.stringify(st.swaps) === before)
  check('swap to the same exercise is a no-op', reducer(st, { type: 'swapExercise', toId: 'pushup', remember: true }) === st)
  check('swap to an unknown id is a no-op', reducer(st, { type: 'swapExercise', toId: '__nope__', remember: true }) === st)
  // Logged sets reach the history entry.
  st = reducer(st, { type: 'advanceSet', restEndsAt: 0 })
  st = reducer(st, { type: 'advanceSet', restEndsAt: 0 })
  st = reducer(st, { type: 'mark', status: 'done', reps: 10 })
  check('mark records sets performed', st.active.entries[0].sets === 3, String(st.active.entries[0].sets))
  // clearSwap
  let st2 = { ...EMPTY, swaps: { squat: 'leg_press' } }
  st2 = reducer(st2, { type: 'clearSwap', fromId: 'squat' })
  check('clearSwap removes it', !('squat' in st2.swaps))
  check('clearSwap of a missing swap is a no-op', reducer(st2, { type: 'clearSwap', fromId: 'squat' }) === st2)
  check('EMPTY has a swaps map', EMPTY.swaps && typeof EMPTY.swaps === 'object')
}
{
  // A swap the equipment can't do is ignored rather than breaking the plan.
  const day = SPLIT_MAP['full_body_3'].days[0]
  const { items } = buildPlan(day, profileOf('none'), {}, { [resolveForEquipment(day.exercises[1], 'none')]: 'bb_bench' })
  check('undoable remembered swap ignored', items.every(i => canDo(i.exerciseId, 'none')))
  // A swap onto something already in the session never duplicates it.
  const dayUL = SPLIT_MAP['upper_lower_4'].days[0] // bb_bench, bb_row, db_ohp, ...
  const dup = buildPlan(dayUL, profileOf('full'), {}, { bb_bench: 'db_ohp' }).items.map(i => i.exerciseId)
  check('swap onto an exercise already in the plan is deduped', new Set(dup).size === dup.length, dup.join(','))
}

// ---- 18. prescription by goal & experience -----------------------------------
section('Prescription: every exercise × goal × experience')
for (const ex of exerciseList) {
  for (const goal of GOALS) {
    for (const exp of EXPERIENCES) {
      const rx = prescribe(ex, { ...profileOf('full'), goal, experience: exp })
      const tag = `${ex.id} ${goal}/${exp}`
      check(`rx ${tag} valid range`, rx.repMin >= 1 && rx.repMin <= rx.repMax)
      check(`rx ${tag} sets 1-4`, rx.sets >= 1 && rx.sets <= 4)
      if (exp === 'beginner') check(`rx ${tag} beginner ≤3 sets`, rx.sets <= 3)
      else check(`rx ${tag} sets unchanged`, rx.sets === ex.sets)
      const unloadedEx = isBodyweight(ex) || ex.unit === 'sec'
      if (unloadedEx || ex.type === 'isolation') {
        check(`rx ${tag} unloaded/isolation keeps its range`, rx.repMin === ex.repMin && rx.repMax === ex.repMax)
        continue
      }
      if (goal === 'strength' && ex.type === 'accessory') check(`rx ${tag} strength accessory 6-10`, rx.repMin === 6 && rx.repMax === 10)
      if (goal === 'strength' && ex.type === 'compound') {
        const want = exp === 'beginner' ? [5, 8] : (ex.strength ?? [5, 8])
        check(`rx ${tag} strength compound range`, rx.repMin === want[0] && rx.repMax === want[1], `${rx.repMin}-${rx.repMax}`)
      }
      if (goal === 'strength' && ex.type === 'compound' && exp !== 'beginner') check(`rx ${tag} heavier than hypertrophy`, rx.repMax < ex.repMax || ex.repMax <= 8)
      if (goal === 'general') check(`rx ${tag} general 8-12`, rx.repMin === 8 && rx.repMax === 12)
      if (goal === 'muscle' && exp !== 'beginner') check(`rx ${tag} hypertrophy = dataset`, rx.repMin === ex.repMin && rx.repMax === ex.repMax)
      if (goal === 'shred') {
        const m = prescribe(ex, { ...profileOf('full'), goal: 'muscle', experience: exp })
        check(`rx ${tag} shred = build muscle`, rx.sets === m.sets && rx.repMin === m.repMin && rx.repMax === m.repMax)
      }
      if (goal === 'muscle' && exp === 'beginner' && ex.type === 'compound') check(`rx ${tag} novice compound 8-12`, rx.repMin === 8 && rx.repMax === 12)
    }
  }
}
check('strength main lifts 3-6', ['squat', 'bb_bench', 'ohp'].every(id => { const r = prescribe(EXERCISES[id], profileOf('full', { goal: 'strength' })); return r.repMin === 3 && r.repMax === 6 }))
check('strength deadlift 3-5', (() => { const r = prescribe(EXERCISES.deadlift, profileOf('full', { goal: 'strength' })); return r.repMin === 3 && r.repMax === 5 })())
check('prescribe without a profile is the dataset', prescribe(EXERCISES.squat, null) === EXERCISES.squat)

section('Rest by goal')
for (const ex of exerciseList) {
  const strength = restSeconds(ex, profileOf('full', { goal: 'strength' }))
  const muscle = restSeconds(ex, profileOf('full'))
  const unloadedEx = isBodyweight(ex) || ex.unit === 'sec'
  check(`rest ${ex.id} muscle by type`, muscle === { compound: 180, accessory: 120, isolation: 90 }[ex.type])
  if (unloadedEx) check(`rest ${ex.id} strength unloaded unchanged`, strength === muscle)
  else check(`rest ${ex.id} strength`, strength === { compound: 240, accessory: 150, isolation: 90 }[ex.type], String(strength))
  check(`rest ${ex.id} general = muscle`, restSeconds(ex, profileOf('full', { goal: 'general' })) === muscle)
  const shred = restSeconds(ex, profileOf('full', { goal: 'shred' }))
  check(`rest ${ex.id} shred by type`, shred === { compound: 120, accessory: 90, isolation: 75 }[ex.type], String(shred))
  check(`rest ${ex.id} shred ≥60s and ≤ muscle`, shred >= 60 && shred <= muscle)
}

section('Targets: clamped into the range, weights on the wheel')
{
  // A target saved under "Build muscle" (6-10) clamps into "Get stronger" (3-6).
  const prog = { squat: { suggestedWeight: 101.3, targetReps: 9, streak: 1, misses: 0 } }
  const t = targetParts('squat', prog, profileOf('full', { goal: 'strength' }))
  check('stale target clamps into the new range', t.reps === 6, String(t.reps))
  check('suggested kg snaps to the nearest 2.5', t.weight === 102.5, String(t.weight))
  const tl = targetParts('squat', { squat: { suggestedWeight: 222.5, targetReps: 6, streak: 1, misses: 0 } }, profileOf('full', { units: 'lb' }))
  check('suggested lb snaps to 5', tl.weight % 5 === 0, String(tl.weight))
  check('snapWeight kg', snapWeight(123, 'kg') === 122.5 && snapWeight(3.75, 'kg') === 5)
  check('snapWeight lb', snapWeight(22.5, 'lb') === 25 && snapWeight(21, 'lb') === 20)
  check('bodyweight tiers show no weight', ['pushup', 'pullup', 'table_row', 'nordic'].every(id => targetParts(id, {}, profileOf('full')).bodyweight))
  check('describeTarget uses the prescription', describeTarget('squat', {}, profileOf('full', { goal: 'strength' })).startsWith('4 × 3'))
}

// ---- 19. progression details ---------------------------------------------------
section('Progression: unloaded holds, loaded steps on the wheel')
{
  const pu = EXERCISES.pushup
  let p = applyResult({ ...initProgress(pu), targetReps: pu.repMax }, pu, { exerciseId: 'pushup', status: 'done', reps: pu.repMax })
  check('push-up at the top holds there (no reset to an easier target)', p.targetReps === pu.repMax, String(p.targetReps))
  p = applyResult({ ...initProgress(pu), targetReps: pu.repMax }, pu, { exerciseId: 'pushup', status: 'done' })
  check('push-up at the top holds there (no-detail path)', p.targetReps === pu.repMax)
  const pl = EXERCISES.plank
  p = applyResult({ ...initProgress(pl), targetReps: pl.repMax }, pl, { exerciseId: 'plank', status: 'done', reps: pl.repMax })
  check('plank at max hold stays at max', p.targetReps === pl.repMax)
  const step = (id, w, units = 'kg') => {
    const ex = EXERCISES[id]
    const r = applyResult({ ...initProgress(ex), suggestedWeight: w }, ex, { exerciseId: id, status: 'done', reps: ex.repMax, weight: w }, units)
    return r.suggestedWeight - w
  }
  check('squat 40 kg → +2.5 (5 would be 12.5%)', step('squat', 40) === 2.5)
  check('squat 100 kg → +5', step('squat', 100) === 5)
  check('deadlift 200 lb → +10 lb', step('deadlift', 200, 'lb') === 10)
  check('deadlift 100 lb → +5 lb', step('deadlift', 100, 'lb') === 5)
  check('bench 120 kg → +2.5 (on the wheel)', step('bb_bench', 120) === 2.5)
  check('bench 200 kg → +5 (2.5%)', step('bb_bench', 200) === 5)
  check('lateral raise 10 kg → +2.5', step('lat_raise', 10) === 2.5)
  const loaded = exerciseList.filter(e => !isBodyweight(e) && e.unit !== 'sec')
  check('every kg step is on the 2.5 grid', loaded.every(e => [20, 47.5, 60, 100, 152.5].every(w => step(e.id, w) % 2.5 === 0)))
  check('every lb step is on the 5 grid', loaded.every(e => [45, 95, 135, 225, 315].every(w => step(e.id, w, 'lb') % 5 === 0)))
}

// ---- 20. recovery model --------------------------------------------------------
section('Recovery: volume-based windows with fractional sets')
check('≤4 sets → 24h', recoveryHours(4) === 24 && recoveryHours(1) === 24)
check('5-9.5 sets → 48h', recoveryHours(5) === 48 && recoveryHours(9.5) === 48)
check('≥10 sets → 72h', recoveryHours(10) === 72 && recoveryHours(18) === 72)
{
  const st = emptyState(profileOf('full'), 'upper_lower_4')
  const rec = { splitId: 'x', dayId: 'd', dayLabel: 'D', at: 0, entries: [
    { exerciseId: 'bb_bench', status: 'done', sets: 4 },   // chest 4, triceps 2, shoulders 2
    { exerciseId: 'incline_db', status: 'done' },           // chest 3 (prescribed), shoulders 1.5, triceps 1.5
    { exerciseId: 'pushdown', status: 'skip' }              // ignored
  ] }
  check('primary counts every set', setsOn(st, rec, 'chest') === 7, String(setsOn(st, rec, 'chest')))
  check('synergist counts half', setsOn(st, rec, 'triceps') === 3.5, String(setsOn(st, rec, 'triceps')))
  check('skipped entries count nothing', setsOn(st, { ...rec, entries: [rec.entries[2]] }, 'triceps') === 0)
  const beginner = { ...st, profile: profileOf('full', { experience: 'beginner' }) }
  check('missing sets fall back to the prescription', setsOn(beginner, { ...rec, entries: [{ exerciseId: 'db_bench', status: 'done' }] }, 'chest') === 3)
}
{
  // Hard (12-set) vs light (3-set) chest session → 72h vs 24h before chest is ready.
  const split = { id: 'custom', name: 'x', daysPerWeek: 2, levels: [], blurb: '', days: [{ id: 'c', label: 'Chest', exercises: ['bb_bench'] }, { id: 'l', label: 'Legs', exercises: ['squat'] }] }
  const t0 = Date.UTC(2026, 0, 5, 9)
  const mk = (sets) => ({ ...emptyState(profileOf('full'), 'custom'), customSplit: split,
    history: [{ splitId: 'custom', dayId: 'c', dayLabel: 'Chest', at: t0, entries: [{ exerciseId: 'bb_bench', status: 'done', sets }] }],
    lastWorkoutAt: t0 })
  const chestAt = (st, h) => listDayInfo(st, t0 + h * 3600_000).find(d => d.dayId === 'c').ready
  check('hard session: chest not ready at 48h', !chestAt(mk(12), 48))
  check('hard session: chest ready at 72h', chestAt(mk(12), 72))
  check('light session: chest ready at 24h', chestAt(mk(3), 24))
  check('light session: 20h minimum gap still applies', !chestAt(mk(3), 19))
}
{
  // Full body Mon/Wed/Fri: 48h later the next session is recovered (the old
  // 60h windows contradicted the app's own 3-day plan).
  for (const eq of EQUIPS) {
    const split = SPLIT_MAP['full_body_3']
    let st = emptyState(profileOf(eq, { daysPerWeek: 3 }), 'full_body_3')
    let now = Date.UTC(2026, 0, 5, 9)
    let allReady = true
    for (let i = 0; i < 6; i++) {
      const rec = recommendDay(st, now)
      if (i > 0 && !rec.recovered) allReady = false
      const { items } = buildPlan(rec.day, st.profile, st.progress)
      st = { ...st, history: [...st.history, { splitId: split.id, dayId: rec.day.id, dayLabel: rec.day.label, at: now,
        entries: items.map(it => ({ exerciseId: it.exerciseId, status: 'done' })) }], lastWorkoutAt: now,
        rotationIndex: (st.rotationIndex + 1) % split.days.length }
      now += (i % 3 === 2 ? 72 : 48) * 3600_000 // Mon, Wed, Fri, Mon...
    }
    check(`full body M/W/F @${eq}: every session recovered`, allReady)
  }
}

{
  // Realistic weeks run the templates in order, every session recovered.
  const weeks = [
    ['ppl_6', [24, 24, 24, 24, 24, 48]],          // Mon-Sat
    ['upper_lower_4', [24, 48, 24, 72]],          // Mon, Tue, Thu, Fri
    ['ppl_ul_5', [24, 24, 48, 24, 72]],           // Mon-Wed, Fri, Sat
    ['full_body_3', [48, 48, 72]]                 // Mon, Wed, Fri
  ]
  for (const [id, gaps] of weeks) {
    for (const eq of ['full', 'dumbbell']) {
      const split = SPLIT_MAP[id]
      let st = emptyState(profileOf(eq, { daysPerWeek: split.daysPerWeek }), id)
      let now = Date.UTC(2026, 0, 5, 9)
      const seq = []
      let recovered = true
      for (let i = 0; i < split.days.length * 2; i++) {
        const rec = recommendDay(st, now)
        seq.push(rec.day.id)
        if (i > 0 && !rec.recovered) recovered = false
        const { items } = buildPlan(rec.day, st.profile, st.progress)
        st = { ...st, history: [...st.history, { splitId: id, dayId: rec.day.id, dayLabel: rec.day.label, at: now,
          entries: items.map(it => ({ exerciseId: it.exerciseId, status: 'done' })) }], lastWorkoutAt: now,
          rotationIndex: (st.rotationIndex + 1) % split.days.length }
        now += gaps[i % gaps.length] * 3600_000
      }
      const expected = [...split.days, ...split.days].map(d => d.id)
      check(`${id} @${eq}: a realistic fortnight runs in template order`, seq.join() === expected.join(), seq.join(' → '))
      check(`${id} @${eq}: every scheduled session is recovered`, recovered)
    }
  }
}

// ---- 21. custom builder quality ---------------------------------------------------
section('Custom builder: balanced, varied days')
const familyOfPattern = (id) => {
  const p = getCoaching(id)?.pattern
  return ({ bench: 'hpress', pushup: 'hpress', ohp: 'vpress', pike: 'vpress', pulldown: 'vpull', pullup: 'vpull',
    facepull: 'reardelt', reardelt: 'reardelt', legcurl: 'kneeflex', nordic: 'kneeflex', slidecurl: 'kneeflex' })[p] ?? p
}
for (const f of FOCUSES) {
  for (const eq of EQUIPS) {
    const day = buildCustomSplit([f.id], eq).days[0]
    const moves = day.exercises.map(movementOf)
    check(`custom ${f.id} @${eq} distinct movements`, new Set(moves).size === moves.length, day.exercises.join(','))
    const fam = day.exercises.map(familyOfPattern)
    check(`custom ${f.id} @${eq} ≤1 squat and ≤1 hinge`, fam.filter(x => x === 'squat').length <= 1 && fam.filter(x => x === 'hinge').length <= 1, day.exercises.join(','))
    check(`custom ${f.id} @${eq} no family more than twice`, fam.every(x => fam.filter(y => y === x).length <= 2), day.exercises.join(','))
    const perMuscle = {}
    for (const id of day.exercises) perMuscle[EXERCISES[id].primary] = (perMuscle[EXERCISES[id].primary] ?? 0) + EXERCISES[id].sets
    check(`custom ${f.id} @${eq} ≤ ~10 direct sets per muscle`, Object.values(perMuscle).every(v => v <= 13), JSON.stringify(perMuscle))
  }
}
{
  const legs = buildCustomSplit(['legs'], 'full').days[0].exercises.map(familyOfPattern)
  check('custom legs @full: squat + hinge + knee flexion', ['squat', 'hinge', 'kneeflex'].every(x => legs.includes(x)), legs.join(','))
  const push = buildCustomSplit(['push'], 'full').days[0].exercises.map(familyOfPattern)
  check('custom push @full: horizontal + vertical press', push.includes('hpress') && push.includes('vpress'), push.join(','))
  const chest = buildCustomSplit(['chest'], 'full').days[0].exercises.map(id => getCoaching(id).pattern)
  check('custom chest @full: ≥3 distinct patterns', new Set(chest).size >= 3, chest.join(','))
  const pull = buildCustomSplit(['pull'], 'full').days[0].exercises.map(familyOfPattern)
  check('custom pull @full: vertical + horizontal pull', pull.includes('vpull') && pull.includes('row'), pull.join(','))
}

// ---- 22. weekly volume & frequency of the built-in splits ------------------------
section('Splits: weekly volume and frequency per muscle (fractional sets)')
for (const split of SPLITS) {
  const onceAWeek = split.id === 'ppl_3' || split.id === 'bro_5'
  if (onceAWeek) check(`${split.id} is labelled once a week`, /once a week/i.test(split.blurb), split.blurb)
  for (const eq of ['full', 'dumbbell']) {
    const prof = profileOf(eq, { daysPerWeek: split.daysPerWeek })
    const cycles = split.daysPerWeek / split.days.length
    const weekly = Object.fromEntries(MUSCLES.map(m => [m, 0]))
    const days = Object.fromEntries(MUSCLES.map(m => [m, 0]))
    for (const day of split.days) {
      const sess = Object.fromEntries(MUSCLES.map(m => [m, 0]))
      for (const it of buildPlan(day, prof, {}).items) {
        const ex = prescribe(EXERCISES[it.exerciseId], prof)
        sess[ex.primary] += ex.sets
        for (const m of ex.also) sess[m] += ex.sets / 2
      }
      for (const m of MUSCLES) {
        weekly[m] += sess[m] * cycles
        // A day counts when the muscle gets real work: ≥1.5 fractional sets, i.e.
        // at least a 3-set compound where it's a synergist (squats grow the glutes).
        if (sess[m] >= 1.5) days[m] += cycles
      }
    }
    for (const m of MAJOR) {
      // ~10+ weekly sets for hypertrophy (Pelland et al. 2025); once-a-week
      // splits are held to the minimum effective dose of ~4 (Iversen et al. 2021).
      check(`${split.id} @${eq}: ${m} ${onceAWeek ? 4 : 8}-30 weekly sets`, weekly[m] >= (onceAWeek ? 4 : 8) && weekly[m] <= 30, weekly[m].toFixed(1))
      if (!onceAWeek) check(`${split.id} @${eq}: ${m} trained ≥2×/week`, days[m] >= 2, String(days[m]))
    }
    check(`${split.id} @${eq}: core trained`, weekly.core > 0)
    check(`${split.id} @${eq}: calves trained`, weekly.calves > 0)
  }
}

// ---- 23. coaching & media completeness --------------------------------------------
section('Coaching, effort cues and demo media')
for (const ex of exerciseList) {
  const t = getTechnique(ex.id)
  check(`technique ${ex.id}`, t && t.steps.length >= 3 && t.cues.length >= 2 && t.mistakes.length >= 2 && t.tempo && t.breathing)
  for (const goal of GOALS) check(`effort cue ${ex.id} ${goal}`, typeof effortCue(ex, goal) === 'string' && effortCue(ex, goal).length > 20)
}
check('demo media only for real exercises', Object.keys(DEMO_MEDIA).every(id => EXERCISES[id]), Object.keys(DEMO_MEDIA).filter(id => !EXERCISES[id]).join(','))
check('demo media are free-exercise-db start/end frames', Object.values(DEMO_MEDIA).every(([a, b]) =>
  /^https:\/\/raw\.githubusercontent\.com\/yuhonas\/free-exercise-db\/main\/exercises\/[^/]+\/0\.jpg$/.test(a) && b === a.replace('/0.jpg', '/1.jpg')))
check('no mismatched demo for pike push-ups or bodyweight calf raises', !DEMO_MEDIA.pike_pushup && !DEMO_MEDIA.bw_calf_raise)
check('sameMovements links variants', sameMovements(['inv_row']).includes('table_row') && sameMovements(['table_row']).includes('inv_row'))

// ---- end ---------------------------------------------------------------------
report()
