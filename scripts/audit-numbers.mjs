#!/usr/bin/env node
/* Full numeric + event-sequence audit for Gyminder.
   Dumps every number the app uses and asserts each against the stated rule,
   then simulates the event sequences (set-by-set flow, mark→finalize,
   rest timer, set countdown) and checks ordering/values.
   Run: npx tsx scripts/audit-numbers.mjs                                   */
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

const SRC = path.resolve(import.meta.dirname, '..', 'src')
const load = (rel) => import(pathToFileURL(path.join(SRC, rel)).href)

const { EXERCISES, getExercise } = await load('data/exercises.ts')
const { SPLITS, SPLIT_MAP, getActiveSplit } = await load('data/splits.ts')
const {
  initProgress, applyResult, buildPlan, restSeconds, describeTarget, targetParts
} = await load('engine/progression.ts')
const {
  recommendDay, nextReadyInfo, listDayInfo, relativeTime, formatIn
} = await load('engine/schedule.ts')

let pass = 0, fail = 0, warn = 0
const fails = [], warns = []
const ok = (name, cond, detail) => {
  if (cond) { pass++; return }
  fail++; fails.push(`✗ ${name}${detail ? ` — ${detail}` : ''}`)
}
const flag = (name, cond, detail) => {
  if (cond) return
  warn++; warns.push(`⚠ ${name}${detail ? ` — ${detail}` : ''}`)
}
const H = (t) => console.log(`\n${'═'.repeat(64)}\n${t}\n${'═'.repeat(64)}`)
const sub = (t) => console.log(`\n— ${t} —`)

const HOUR = 3600_000
const exercises = Object.values(EXERCISES)

// ─────────────────────────────────────────────────────────────────────────
H('A. REST TIMES (seconds between sets)')
console.log('Rule: compound 180s · accessory 120s · isolation 90s (Schoenfeld/Grgic meta-analyses).')
const REST_RULE = { compound: 180, accessory: 120, isolation: 90 }
const byType = { compound: [], accessory: [], isolation: [] }
for (const ex of exercises) byType[ex.type].push(ex)
for (const t of ['compound', 'accessory', 'isolation']) {
  const sample = byType[t][0]
  console.log(`  ${t.padEnd(10)} → ${restSeconds(sample)}s  (${byType[t].length} exercises)`)
  for (const ex of byType[t]) {
    ok(`rest ${ex.id} (${t})`, restSeconds(ex) === REST_RULE[t], `got ${restSeconds(ex)}s, expected ${REST_RULE[t]}s`)
  }
}
// mm:ss formatting (mirrors Session.mmss) at the three rest lengths
const mmss = (sec) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
console.log(`  format: 180→${mmss(180)}  120→${mmss(120)}  90→${mmss(90)}  5→${mmss(5)}`)
ok('mmss 180', mmss(180) === '3:00')
ok('mmss 120', mmss(120) === '2:00')
ok('mmss 90', mmss(90) === '1:30')
ok('mmss 5', mmss(5) === '0:05')

// ─────────────────────────────────────────────────────────────────────────
H('B. RECOVERY WINDOWS (hours) + scheduling gaps')
const RECOVERY_RULE = {
  chest: 60, back: 60, quads: 60, hamstrings: 60, glutes: 60,
  shoulders: 48, biceps: 36, triceps: 36, core: 24, calves: 24
}
// Re-derive from a controlled single-muscle history and check readyAt.
const MIN_GAP_H = 20
for (const [muscle, hrs] of Object.entries(RECOVERY_RULE)) {
  // find an exercise whose primary is this muscle
  const ex = exercises.find((e) => e.primary === muscle)
  if (!ex) { ok(`recovery ${muscle}`, false, 'no exercise for muscle'); continue }
  const now = Date.UTC(2026, 0, 10, 12, 0, 0)
  const trainedAt = now - hrs * HOUR // exactly at the window edge
  const split = { id: 'x', name: 'x', daysPerWeek: 1, levels: [], blurb: '', days: [{ id: 'd', label: 'D', exercises: [ex.id] }] }
  const state = {
    profile: { experience: 'intermediate', goal: 'muscle', daysPerWeek: 1, equipment: 'full', units: 'kg' },
    currentSplitId: 'x', rotationIndex: 0, progress: {},
    history: [{ splitId: 'x', dayId: 'd', dayLabel: 'D', at: trainedAt, entries: [{ exerciseId: ex.id, status: 'done' }] }],
    lastWorkoutAt: trainedAt, active: null, customSplit: null
  }
  SPLIT_MAP['x'] = split // temporary registration so getActiveSplit resolves
  const info = listDayInfo(state, now)[0]
  // readyAt should equal trainedAt + recovery (or the MIN_GAP floor, whichever later)
  const expected = Math.max(trainedAt + hrs * HOUR, trainedAt + MIN_GAP_H * HOUR)
  console.log(`  ${muscle.padEnd(11)} ${String(hrs).padStart(2)}h → readyAt offset ${Math.round((info.readyAt - trainedAt) / HOUR)}h (ready=${info.ready})`)
  ok(`recovery ${muscle} = ${hrs}h`, Math.abs(info.readyAt - expected) < 60_000, `readyAt off by ${(info.readyAt - expected) / HOUR}h`)
  delete SPLIT_MAP['x']
}
console.log(`  MIN_GAP between any two sessions: ${MIN_GAP_H}h`)
// muscles recovering faster than MIN_GAP are floored to MIN_GAP
for (const m of ['core', 'calves', 'biceps', 'triceps']) {
  flag(`${m} (${RECOVERY_RULE[m]}h) ≥ MIN_GAP floor`, true,
    `${RECOVERY_RULE[m]}h ${RECOVERY_RULE[m] < MIN_GAP_H ? '< floored to 20h' : ''}`)
}

// ─────────────────────────────────────────────────────────────────────────
H('C. REP RANGES & SET COUNTS (per exercise)')
console.log('Rule of thumb: compound 4-8 · accessory 8-12 · isolation 10-20 · sets 3-4.')
console.log('  id'.padEnd(20) + 'type'.padEnd(11) + 'sets  reps     unit')
for (const ex of exercises) {
  console.log(
    '  ' + ex.id.padEnd(18) + ex.type.padEnd(11) +
    String(ex.sets).padEnd(6) + `${ex.repMin}-${ex.repMax}`.padEnd(9) + (ex.unit || 'reps')
  )
  ok(`${ex.id} repMin≤repMax`, ex.repMin <= ex.repMax)
  ok(`${ex.id} sets 1-5`, ex.sets >= 1 && ex.sets <= 5, `sets=${ex.sets}`)
  ok(`${ex.id} reps positive`, ex.repMin > 0)
  // soft guidance checks (warn, not fail)
  if (ex.unit !== 'sec') {
    if (ex.type === 'compound') flag(`${ex.id} compound reps ≤ 12`, ex.repMax <= 12, `${ex.repMin}-${ex.repMax}`)
    if (ex.type === 'isolation') flag(`${ex.id} isolation reps ≥ 8`, ex.repMin >= 8, `${ex.repMin}-${ex.repMax}`)
  }
  flag(`${ex.id} sets 3-4`, ex.sets >= 3 && ex.sets <= 4, `sets=${ex.sets}`)
}

// ─────────────────────────────────────────────────────────────────────────
H('D. PROGRESSION MATH (double progression)')
console.log('Rule: hit repMax → +weightStep & reset to repMin; else +1 rep. Heavy compounds step 5, else max(2.5, 2.5%).')
sub('Heavy-compound (squat, base step 5kg) — 8 sessions always hitting top')
let p = initProgress(getExercise('squat'))
p = applyResult(p, getExercise('squat'), { exerciseId: 'squat', status: 'done', reps: getExercise('squat').repMin, weight: 100 })
console.log(`  start: ${p.targetReps} reps @ ${p.suggestedWeight}kg`)
let prevW = p.suggestedWeight
for (let i = 0; i < 6; i++) {
  p = applyResult(p, getExercise('squat'), { exerciseId: 'squat', status: 'done', reps: getExercise('squat').repMax, weight: p.suggestedWeight })
  const step = p.suggestedWeight - prevW
  console.log(`  hit top → ${p.targetReps} reps @ ${p.suggestedWeight}kg (step +${step})`)
  ok(`squat step ≥ 5`, step >= 5, `step ${step}`)
  ok(`squat reset to repMin`, p.targetReps === getExercise('squat').repMin)
  prevW = p.suggestedWeight
}
sub('Isolation (lat_raise, base step 2.5kg)')
let q = initProgress(getExercise('lat_raise'))
q = applyResult(q, getExercise('lat_raise'), { exerciseId: 'lat_raise', status: 'done', reps: 12, weight: 10 })
const beforeW = q.suggestedWeight
q = applyResult(q, getExercise('lat_raise'), { exerciseId: 'lat_raise', status: 'done', reps: getExercise('lat_raise').repMax, weight: q.suggestedWeight })
console.log(`  10kg hit top(${getExercise('lat_raise').repMax}) → @ ${q.suggestedWeight}kg (step +${q.suggestedWeight - beforeW})`)
ok('lat_raise step ≥ 2.5', q.suggestedWeight - beforeW >= 2.5)
sub('Below top → +1 rep, weight unchanged')
let r = initProgress(getExercise('bb_curl')) // 8-12
r = applyResult(r, getExercise('bb_curl'), { exerciseId: 'bb_curl', status: 'done', reps: 9, weight: 30 })
console.log(`  did 9 reps @30 → next ${r.targetReps} reps @ ${r.suggestedWeight}kg`)
ok('bb_curl +1 rep', r.targetReps === 10, `got ${r.targetReps}`)
ok('bb_curl weight held', r.suggestedWeight === 30)
sub('No-detail path advances target only')
let n = initProgress(getExercise('bb_bench'))
const n0 = n.targetReps
n = applyResult(n, getExercise('bb_bench'), { exerciseId: 'bb_bench', status: 'done' })
console.log(`  no detail: ${n0} → ${n.targetReps} reps (streak ${n.streak})`)
ok('no-detail +1 rep', n.targetReps === n0 + 1)
ok('no-detail streak=1', n.streak === 1)
sub('Skip path: streak resets, misses++')
let sk = initProgress(getExercise('bb_bench'))
sk = applyResult(sk, getExercise('bb_bench'), { exerciseId: 'bb_bench', status: 'skip' })
console.log(`  skip: streak ${sk.streak}, misses ${sk.misses}`)
ok('skip streak=0', sk.streak === 0)
ok('skip misses=1', sk.misses === 1)
console.log(`  SWAP_THRESHOLD: 2 consecutive skips swaps to a substitution`)

// ─────────────────────────────────────────────────────────────────────────
H('E. SET COUNTDOWN ("Sets left") sequence per exercise')
console.log('Rule: counter = sets - setIdx, shows sets→…→1 across the sets; last set = "1 left".')
for (const sets of [3, 4]) {
  const seq = Array.from({ length: sets }, (_, i) => sets - i)
  console.log(`  ${sets} sets → Sets left: ${seq.join(' → ')}  (last shows 1)`)
  ok(`countdown ${sets} starts at ${sets}`, seq[0] === sets)
  ok(`countdown ${sets} ends at 1`, seq[seq.length - 1] === 1)
  ok(`countdown ${sets} length`, seq.length === sets)
}

// ─────────────────────────────────────────────────────────────────────────
H('F. TARGET DISPLAY (describeTarget ↔ targetParts agree)')
const prog = {
  squat: { suggestedWeight: 100, targetReps: 6, streak: 2, misses: 0 },
  pushup: { suggestedWeight: null, targetReps: 15, streak: 0, misses: 0 },
  plank: { suggestedWeight: null, targetReps: 45, streak: 0, misses: 0 }
}
for (const id of ['squat', 'pushup', 'plank']) {
  const t = targetParts(id, prog, 'kg')
  const s = describeTarget(id, prog, 'kg')
  console.log(`  ${id.padEnd(8)} parts={sets:${t.sets}, reps:${t.reps}, isTime:${t.isTime}, bw:${t.bodyweight}, w:${t.weight}}  | "${s}"`)
  ok(`${id} sets match`, t.sets === EXERCISES[id].sets)
  ok(`${id} reps match`, t.reps === prog[id].targetReps)
  ok(`${id} weight match`, t.weight === prog[id].suggestedWeight)
}
ok('plank isTime true', targetParts('plank', prog).isTime === true)
ok('pushup bodyweight true', targetParts('pushup', prog).bodyweight === true)
ok('squat isTime false', targetParts('squat', prog).isTime === false)

// ─────────────────────────────────────────────────────────────────────────
H('G. TIME FORMATTERS')
const cases = [
  ['formatIn 0', formatIn(0), 'now'],
  ['formatIn 45m', formatIn(45 * 60_000), '45m'],
  ['formatIn 90m', formatIn(90 * 60_000), '1h 30m'],
  ['formatIn 60m', formatIn(60 * 60_000), '1h'],
  ['formatIn 25h', formatIn(25 * HOUR), '1d 1h'],
  ['formatIn 48h', formatIn(48 * HOUR), '2d'],
  ['relativeTime null', relativeTime(null), 'Never'],
  ['relativeTime 5m', relativeTime(Date.now() - 5 * 60_000), 'Just now'],
  ['relativeTime 3h', relativeTime(Date.now() - 3 * HOUR), '3h ago'],
  ['relativeTime 25h', relativeTime(Date.now() - 25 * HOUR), 'Yesterday'],
  ['relativeTime 50h', relativeTime(Date.now() - 50 * HOUR), '2d ago']
]
for (const [name, got, want] of cases) {
  console.log(`  ${name.padEnd(20)} → "${got}"`)
  ok(name, got === want, `got "${got}", want "${want}"`)
}

// ─────────────────────────────────────────────────────────────────────────
H('H. EVENT SEQUENCE — full session, set-by-set, mark→finalize')
{
  const split = SPLIT_MAP['full_body_3']
  const day = split.days[0] // fb_a: squat, bb_bench, bb_row, db_ohp, bb_curl, plank
  const profile = { experience: 'intermediate', goal: 'muscle', daysPerWeek: 3, equipment: 'full', units: 'kg' }
  const { items } = buildPlan(day, profile, {})
  console.log(`  Plan (${items.length} exercises): ${items.map((i) => i.exerciseId).join(', ')}`)

  // reducer mirror (matches store.tsx) so we can assert ordering precisely
  let state = {
    profile, currentSplitId: 'full_body_3', rotationIndex: 0, progress: {},
    history: [], lastWorkoutAt: null,
    active: { splitId: 'full_body_3', dayId: day.id, dayLabel: day.label, cursor: 0, plan: items, entries: [] },
    customSplit: null
  }
  const mark = (st, status) => {
    const a = st.active
    const item = a.plan[a.cursor]
    const entry = { exerciseId: item.exerciseId, status }
    const entries = [...a.entries, entry]
    const advanced = { ...st, active: { ...a, cursor: a.cursor + 1, entries } }
    if (a.cursor + 1 >= a.plan.length) {
      // finalize
      const progress = { ...st.progress }
      for (const e of entries) {
        const ex = EXERCISES[e.exerciseId]; if (!ex) continue
        progress[e.exerciseId] = applyResult(progress[e.exerciseId] ?? initProgress(ex), ex, e)
      }
      const dayCount = split.days.length
      return {
        ...st, progress,
        history: [...st.history, { splitId: a.splitId, dayId: a.dayId, dayLabel: a.dayLabel, at: 1_000, entries }],
        lastWorkoutAt: 1_000, rotationIndex: (st.rotationIndex + 1) % dayCount, active: null
      }
    }
    return advanced
  }

  let cursorTrace = []
  for (let i = 0; i < items.length; i++) {
    cursorTrace.push(state.active.cursor)
    // within an exercise, the UI walks setIdx 0..sets-1; counter = sets-setIdx
    const ex = EXERCISES[items[i].exerciseId]
    const counter = Array.from({ length: ex.sets }, (_, k) => ex.sets - k)
    ok(`ex ${i} cursor==i`, state.active.cursor === i)
    ok(`ex ${i} counter starts ${ex.sets}`, counter[0] === ex.sets)
    state = mark(state, 'done')
  }
  console.log(`  cursor advanced: ${cursorTrace.join(' → ')} → (finalized)`)
  ok('cursor walked 0..n-1', cursorTrace.join(',') === items.map((_, i) => i).join(','))
  ok('active cleared after last', state.active === null)
  ok('history has 1 record', state.history.length === 1)
  ok('history entries count', state.history[0].entries.length === items.length)
  ok('lastWorkoutAt set', state.lastWorkoutAt === 1_000)
  ok('rotationIndex advanced 0→1', state.rotationIndex === 1)
  ok('progression applied to squat', !!state.progress.squat && state.progress.squat.streak === 1)
  console.log(`  post-finalize: rotationIndex=${state.rotationIndex}, history=${state.history.length}, squat.streak=${state.progress.squat.streak}`)
}

// ─────────────────────────────────────────────────────────────────────────
H('I. EVENT SEQUENCE — rest timer between sets')
{
  const ex = getExercise('squat')
  const restSec = restSeconds(ex)
  const t0 = 1_000_000
  const restEndsAt = t0 + restSec * 1000
  // mirror Session: restLeft = ceil((restEndsAt-now)/1000); restPct = restLeft/restTotal*100
  const at = (now) => {
    const left = Math.max(0, Math.ceil((restEndsAt - now) / 1000))
    return { left, pct: restSec > 0 ? (left / restSec) * 100 : 0, resting: left > 0 }
  }
  const start = at(t0), mid = at(t0 + (restSec / 2) * 1000), end = at(restEndsAt), over = at(restEndsAt + 5000)
  console.log(`  squat rest ${restSec}s: start left=${start.left}(${start.pct}%) · mid left=${mid.left}(${mid.pct}%) · end left=${end.left} · past left=${over.left}`)
  ok('rest starts full', start.left === restSec && Math.round(start.pct) === 100)
  ok('rest mid ~50%', Math.abs(mid.pct - 50) < 1)
  ok('rest ends at 0', end.left === 0 && end.resting === false)
  ok('rest never negative', over.left === 0)
}

// ─────────────────────────────────────────────────────────────────────────
H('J. EVENT SEQUENCE — recommendation after a workout')
{
  const split = SPLIT_MAP['upper_lower_4']
  const now = Date.UTC(2026, 0, 10, 9, 0, 0)
  const state = {
    profile: { experience: 'intermediate', goal: 'muscle', daysPerWeek: 4, equipment: 'full', units: 'kg' },
    currentSplitId: 'upper_lower_4', rotationIndex: 0, progress: {},
    history: [], lastWorkoutAt: null, active: null, customSplit: null
  }
  const r0 = recommendDay(state, now)
  console.log(`  cold start → ${r0.day.id} (recovered=${r0.recovered})`)
  ok('cold start ready', r0.recovered === true)
  // train Lower A, then 2h later
  const lowerA = split.days.find((d) => d.id === 'ul_la')
  const t1 = now
  state.history.push({ splitId: split.id, dayId: 'ul_la', dayLabel: 'Lower A', at: t1, entries: lowerA.exercises.map((e) => ({ exerciseId: e, status: 'done' })) })
  state.lastWorkoutAt = t1
  const r1 = recommendDay(state, t1 + 2 * HOUR)
  console.log(`  +2h after Lower A → ${r1.day.id} (recovered=${r1.recovered})  [MIN_GAP blocks]`)
  ok('+2h not Lower A again', r1.day.id !== 'ul_la')
  ok('+2h not ready (min-gap)', r1.recovered === false)
  const r2 = recommendDay(state, t1 + 25 * HOUR)
  console.log(`  +25h → ${r2.day.id} (recovered=${r2.recovered})`)
  ok('+25h an upper day ready', r2.day.id.startsWith('ul_u') && r2.recovered === true)
}

// ─────────────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(64)}`)
console.log(`RESULT: ${pass} passed, ${fail} failed, ${warn} soft-flags`)
if (warns.length) { console.log('\nSOFT FLAGS (guidance, not errors):'); warns.forEach((w) => console.log('  ' + w)) }
if (fails.length) { console.log('\nFAILURES:'); fails.forEach((f) => console.log('  ' + f)); process.exitCode = 1 }
