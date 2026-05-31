#!/usr/bin/env node
// Trace recommendDay for ppl_6 across a 6-day week to see why we don't hit all 6.
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const SRC = path.resolve(import.meta.dirname, '..', 'src')
const { EXERCISES } = await import(pathToFileURL(path.join(SRC, 'data/exercises.ts')).href)
const { SPLIT_MAP } = await import(pathToFileURL(path.join(SRC, 'data/splits.ts')).href)
const { applyResult, initProgress, buildPlan } = await import(pathToFileURL(path.join(SRC, 'engine/progression.ts')).href)
const { recommendDay, listDayInfo } = await import(pathToFileURL(path.join(SRC, 'engine/schedule.ts')).href)

const split = SPLIT_MAP['ppl_6']
const profile = { experience: 'intermediate', goal: 'muscle', daysPerWeek: 6, equipment: 'full', units: 'kg' }
let state = {
  profile,
  currentSplitId: 'ppl_6',
  rotationIndex: 0,
  progress: {},
  history: [],
  lastWorkoutAt: null,
  active: null,
  customSplit: null
}
let now = Date.UTC(2026, 0, 1, 9, 0, 0)

for (let i = 0; i < 6; i++) {
  const rec = recommendDay(state, now)
  console.log(`\nDay ${i + 1} @ ${new Date(now).toISOString()}`)
  console.log(`  Picked: ${rec.day.id} (${rec.day.label}) — recovered=${rec.recovered}`)
  console.log(`  All days status:`)
  for (const info of listDayInfo(state, now)) {
    const isPicked = info.dayId === rec.day.id ? ' ← PICK' : ''
    console.log(`    ${info.dayId}: ready=${info.ready} — ${info.detail}${isPicked}`)
  }
  // Mark done
  const { items } = buildPlan(rec.day, profile, state.progress)
  const entries = items.map(it => ({ exerciseId: it.exerciseId, status: 'done' }))
  const progress = { ...state.progress }
  for (const e of entries) {
    const ex = EXERCISES[e.exerciseId]
    progress[e.exerciseId] = applyResult(progress[e.exerciseId] ?? initProgress(ex), ex, e)
  }
  state = {
    ...state,
    progress,
    history: [...state.history, { splitId: split.id, dayId: rec.day.id, dayLabel: rec.day.label, at: now, entries }],
    lastWorkoutAt: now,
    rotationIndex: (state.rotationIndex + 1) % split.days.length
  }
  now += 24 * 3600_000
}

console.log(`\nUnique days hit: ${new Set(state.history.map(h => h.dayId)).size}`)
console.log(`Sequence: ${state.history.map(h => h.dayId).join(' → ')}`)
