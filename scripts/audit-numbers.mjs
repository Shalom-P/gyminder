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
const { SPLITS, SPLIT_MAP, getActiveSplit, recommendSplitId } = await load('data/splits.ts')
const {
  initProgress, applyResult, buildPlan, restSeconds, describeTarget, targetParts, prescribe
} = await load('engine/progression.ts')
const {
  recommendDay, nextReadyInfo, listDayInfo, relativeTime, formatIn, recoveryHours
} = await load('engine/schedule.ts')
const { isBodyweight } = await load('engine/equipment.ts')
const { reducer, EMPTY } = await load('state/store.tsx')
const profileOf = (extra = {}) => ({
  experience: 'intermediate', goal: 'muscle', daysPerWeek: 4, equipment: 'full', units: 'kg', ...extra
})
const unloaded = (ex) => isBodyweight(ex) || ex.unit === 'sec'

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
console.log('Rule: compound 180s · accessory 120s · isolation 90s (Schoenfeld 2016; Singer 2024);')
console.log('      "Get stronger" loaded work: compound 240s · accessory 150s (Grgic 2018; ACSM 2009).')
const REST_RULE = { compound: 180, accessory: 120, isolation: 90 }
const REST_STRENGTH = { compound: 240, accessory: 150, isolation: 90 }
const byType = { compound: [], accessory: [], isolation: [] }
for (const ex of exercises) byType[ex.type].push(ex)
for (const t of ['compound', 'accessory', 'isolation']) {
  const sample = byType[t].find((e) => !unloaded(e))
  console.log(`  ${t.padEnd(10)} → ${restSeconds(sample)}s · strength ${restSeconds(sample, profileOf({ goal: 'strength' }))}s  (${byType[t].length} exercises)`)
  for (const ex of byType[t]) {
    ok(`rest ${ex.id} (${t})`, restSeconds(ex) === REST_RULE[t], `got ${restSeconds(ex)}s, expected ${REST_RULE[t]}s`)
    const want = unloaded(ex) ? REST_RULE[t] : REST_STRENGTH[t]
    ok(`rest ${ex.id} (${t}, strength)`, restSeconds(ex, profileOf({ goal: 'strength' })) === want)
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
H('B. RECOVERY (hours) — by session volume, not muscle size + scheduling gaps')
console.log('Rule: ≤4 fractional sets → 24h · 5-9.5 → 48h · ≥10 → 72h (Belcher 2019; Soares 2015;')
console.log('      Morán-Navarro 2017). Primary mover = 1 per set, synergist = 0.5 (Pelland 2025).')
const MIN_GAP_H = 20
for (const [sets, hrs] of [[1, 24], [4, 24], [5, 48], [9.5, 48], [10, 72], [16, 72]]) {
  ok(`recoveryHours(${sets}) = ${hrs}`, recoveryHours(sets) === hrs, `got ${recoveryHours(sets)}`)
}
for (const muscle of ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps', 'core', 'calves']) {
  // Same rule for every muscle: one exercise of it, at 3 / 6 / 12 sets.
  const ex = exercises.find((e) => e.primary === muscle && !unloaded(e)) ?? exercises.find((e) => e.primary === muscle)
  const parts = []
  for (const sets of [3, 6, 12]) {
    const now = Date.UTC(2026, 0, 10, 12, 0, 0)
    const trainedAt = now - 1 * HOUR
    const split = { id: 'custom', name: 'x', daysPerWeek: 1, levels: [], blurb: '', days: [{ id: 'd', label: 'D', exercises: [ex.id] }] }
    const state = {
      ...EMPTY, profile: profileOf(), currentSplitId: 'custom', customSplit: split,
      history: [{ splitId: 'custom', dayId: 'd', dayLabel: 'D', at: trainedAt, entries: [{ exerciseId: ex.id, status: 'done', sets }] }],
      lastWorkoutAt: trainedAt
    }
    const info = listDayInfo(state, now)[0]
    const expected = trainedAt + Math.max(recoveryHours(sets), MIN_GAP_H) * HOUR
    parts.push(`${sets} sets→${Math.round((info.readyAt - trainedAt) / HOUR)}h`)
    ok(`recovery ${muscle} after ${sets} sets`, Math.abs(info.readyAt - expected) < 60_000, `readyAt off by ${(info.readyAt - expected) / HOUR}h`)
  }
  console.log(`  ${muscle.padEnd(11)} ${parts.join(' · ')}`)
}
console.log(`  MIN_GAP between any two sessions: ${MIN_GAP_H}h (light 24h sessions are floored at it only below 20h)`)

// ─────────────────────────────────────────────────────────────────────────
H('C. REP RANGES & SET COUNTS (per exercise, "Build muscle" defaults)')
console.log('Rule: loaded compound 6-10 (deadlift 5-8) · accessory 8-12 · isolation 10-20 · unloaded higher · sets 2-4.')
console.log('  id'.padEnd(20) + 'type'.padEnd(11) + 'sets  reps     unit')
for (const ex of exercises) {
  console.log(
    '  ' + ex.id.padEnd(18) + ex.type.padEnd(11) +
    String(ex.sets).padEnd(6) + `${ex.repMin}-${ex.repMax}`.padEnd(9) + (ex.unit || 'reps')
  )
  ok(`${ex.id} repMin≤repMax`, ex.repMin <= ex.repMax)
  ok(`${ex.id} sets 1-5`, ex.sets >= 1 && ex.sets <= 5, `sets=${ex.sets}`)
  ok(`${ex.id} reps positive`, ex.repMin > 0)
  if (!unloaded(ex) && ex.type === 'compound') ok(`${ex.id} loaded compound within 5-12`, ex.repMin >= 5 && ex.repMax <= 12, `${ex.repMin}-${ex.repMax}`)
  if (!unloaded(ex) && ex.type === 'isolation') ok(`${ex.id} loaded isolation within 8-20`, ex.repMin >= 8 && ex.repMax <= 20, `${ex.repMin}-${ex.repMax}`)
  // Light loads only work near failure; past ~30 reps a harder variation is due.
  if (unloaded(ex) && ex.unit !== 'sec') ok(`${ex.id} unloaded reps ≤ 30`, ex.repMax <= 30, `${ex.repMin}-${ex.repMax}`)
  flag(`${ex.id} sets 2-4`, ex.sets >= 2 && ex.sets <= 4, `sets=${ex.sets}`)
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
sub('Heavy lower-body step only from 50 kg / 110 lb (keeps the jump ≤10%)')
for (const [w, units, want] of [[40, 'kg', 2.5], [50, 'kg', 5], [100, 'lb', 5], [110, 'lb', 10]]) {
  const sq = getExercise('squat')
  const r = applyResult({ ...initProgress(sq), suggestedWeight: w }, sq, { exerciseId: 'squat', status: 'done', reps: sq.repMax, weight: w }, units)
  console.log(`  squat ${w}${units} at the top → +${r.suggestedWeight - w}${units}`)
  ok(`squat ${w}${units} step ${want}`, r.suggestedWeight - w === want)
}
sub('Unloaded moves hold at the top (no reset to an easier target)')
{
  const pu = getExercise('pushup')
  const r = applyResult({ ...initProgress(pu), targetReps: pu.repMax }, pu, { exerciseId: 'pushup', status: 'done', reps: pu.repMax })
  console.log(`  push-up ${pu.repMax} reps → next ${r.targetReps} (session note suggests a harder variation)`)
  ok('push-up holds at repMax', r.targetReps === pu.repMax)
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
  const t = targetParts(id, prog, profileOf())
  const s = describeTarget(id, prog, profileOf())
  console.log(`  ${id.padEnd(8)} parts={sets:${t.sets}, reps:${t.reps}, isTime:${t.isTime}, bw:${t.bodyweight}, w:${t.weight}}  | "${s}"`)
  ok(`${id} sets match`, t.sets === EXERCISES[id].sets)
  ok(`${id} reps match`, t.reps === prog[id].targetReps)
  ok(`${id} weight match`, t.weight === prog[id].suggestedWeight)
}
ok('plank isTime true', targetParts('plank', prog).isTime === true)
ok('pushup bodyweight true', targetParts('pushup', prog).bodyweight === true)
ok('squat isTime false', targetParts('squat', prog).isTime === false)

sub('Prescription by goal (intermediate) — squat / bench / deadlift / lat raise')
for (const goal of ['muscle', 'strength', 'general']) {
  const row = ['squat', 'bb_bench', 'deadlift', 'lat_raise'].map((id) => {
    const r = prescribe(getExercise(id), profileOf({ goal }))
    return `${id} ${r.sets}×${r.repMin}-${r.repMax}`
  })
  console.log(`  ${goal.padEnd(8)} ${row.join(' · ')}`)
}
{
  const r = prescribe(getExercise('squat'), profileOf({ experience: 'beginner' }))
  console.log(`  beginner squat ${r.sets}×${r.repMin}-${r.repMax}  (ACSM novice 8-12, ≤3 sets)`)
  ok('beginner squat 3×8-12', r.sets === 3 && r.repMin === 8 && r.repMax === 12)
  const s = prescribe(getExercise('squat'), profileOf({ goal: 'strength' }))
  ok('strength squat 4×3-6', s.sets === 4 && s.repMin === 3 && s.repMax === 6)
  const g = prescribe(getExercise('bb_bench'), profileOf({ goal: 'general' }))
  ok('general bench 4×8-12', g.repMin === 8 && g.repMax === 12)
}

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
H('H. EVENT SEQUENCE — full session, set-by-set, mark→finalize (real reducer)')
{
  const day = SPLIT_MAP['full_body_3'].days[0]
  let state = { ...EMPTY, profile: profileOf({ daysPerWeek: 3 }), currentSplitId: 'full_body_3' }
  state = reducer(state, { type: 'startDay', dayId: day.id })
  const items = state.active.plan
  console.log(`  Plan (${items.length} exercises): ${items.map((i) => i.exerciseId).join(', ')}`)
  const cursorTrace = []
  for (let i = 0; i < items.length; i++) {
    cursorTrace.push(state.active.cursor)
    ok(`ex ${i} cursor==i`, state.active.cursor === i)
    const sets = targetParts(items[i].exerciseId, state.progress, state.profile).sets
    for (let k = 1; k < sets; k++) {
      state = reducer(state, { type: 'advanceSet', restEndsAt: 0 })
      ok(`ex ${i} set ${k + 1} index`, state.active.setIdx === k)
    }
    state = reducer(state, { type: 'mark', status: 'done' })
  }
  console.log(`  cursor advanced: ${cursorTrace.join(' → ')} → (finalized)`)
  ok('cursor walked 0..n-1', cursorTrace.join(',') === items.map((_, i) => i).join(','))
  ok('active cleared after last', state.active === null)
  ok('history has 1 record', state.history.length === 1)
  ok('history entries count', state.history[0].entries.length === items.length)
  ok('history entries carry the sets performed', state.history[0].entries.every((e) => e.sets === targetParts(e.exerciseId, {}, state.profile).sets))
  ok('lastWorkoutAt set', state.lastWorkoutAt === state.history[0].at)
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
H('K. RECOMMENDED SPLIT per profile (≥2×/week per muscle; beginners ≤4 days)')
for (const exp of ['beginner', 'intermediate', 'advanced']) {
  const row = [3, 4, 5, 6].map((d) => `${d}d→${recommendSplitId(profileOf({ experience: exp, daysPerWeek: d }))}`)
  console.log(`  ${exp.padEnd(12)} ${row.join('  ')}`)
  for (const d of [3, 4, 5, 6]) {
    const sid = recommendSplitId(profileOf({ experience: exp, daysPerWeek: d }))
    ok(`${exp} ${d}d not once-a-week`, sid !== 'ppl_3' && sid !== 'bro_5', sid)
  }
}
console.log(`  no equipment, 6d → ${recommendSplitId(profileOf({ daysPerWeek: 6, equipment: 'none' }))}`)

// ─────────────────────────────────────────────────────────────────────────
H('J. EVENT SEQUENCE — recommendation after a workout')
{
  const split = SPLIT_MAP['upper_lower_4']
  const now = Date.UTC(2026, 0, 10, 9, 0, 0)
  const state = { ...EMPTY, profile: profileOf(), currentSplitId: 'upper_lower_4', history: [] }
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
