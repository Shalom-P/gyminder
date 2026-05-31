#!/usr/bin/env node
// Seed Gyminder's localStorage in the running iOS simulator and re-launch.
// Usage: node scripts/seed-sim.mjs <scenario>
// Example: node scripts/seed-sim.mjs home_full_body
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const DEVICE = 'E18BE8C2-A7C8-4B03-BFD2-030BB78F5F19'
const BUNDLE = 'com.blacklemon.gymcoach'
const SHOT_DIR = '/tmp/gymapp_qa'
const DEV_DIR = '/Applications/Xcode.app/Contents/Developer'
fs.mkdirSync(SHOT_DIR, { recursive: true })

function sim(cmd) {
  return execSync(`DEVELOPER_DIR=${DEV_DIR} xcrun simctl ${cmd}`, { encoding: 'utf8' })
}
function dataDir() {
  return sim(`get_app_container ${DEVICE} ${BUNDLE} data`).trim()
}
function lsFile() {
  const base = dataDir()
  const out = execSync(
    `find "${base}/Library/WebKit/${BUNDLE}/WebsiteData/Default" -name 'localstorage.sqlite3' -not -name '*-shm' -not -name '*-wal'`,
    { encoding: 'utf8' }
  ).trim().split('\n')[0]
  if (!out) throw new Error('localStorage not found')
  return out
}

function writeState(state) {
  const ls = lsFile()
  // Encode as UTF-16LE buffer.
  const json = JSON.stringify(state)
  const buf = Buffer.from(json, 'utf16le')
  const hex = buf.toString('hex').toUpperCase()
  // Use a single SQL exec: replace the row.
  // Terminate the app first so WebKit isn't holding the file.
  try { sim(`terminate ${DEVICE} ${BUNDLE}`) } catch {}
  // Wipe the wal/shm to force clean read.
  for (const sfx of ['-wal', '-shm']) {
    try { fs.unlinkSync(ls + sfx) } catch {}
  }
  execSync(
    `sqlite3 "${ls}" "INSERT OR REPLACE INTO ItemTable (key, value) VALUES ('gymapp.v1', x'${hex}');"`,
    { stdio: 'inherit' }
  )
}

function launch() {
  sim(`launch ${DEVICE} ${BUNDLE}`)
}

function screenshot(name) {
  // Give the React app a moment to render.
  execSync('sleep 1.2')
  sim(`io ${DEVICE} screenshot ${SHOT_DIR}/${name}.png`)
  console.log(`📸 ${SHOT_DIR}/${name}.png`)
}

// ---------- state factories ----------
const EMPTY = {
  profile: null, currentSplitId: null, rotationIndex: 0,
  progress: {}, history: [], lastWorkoutAt: null, active: null, customSplit: null
}

function profile(equip = 'full', units = 'kg') {
  return { experience: 'intermediate', goal: 'muscle', daysPerWeek: 4, equipment: equip, units }
}

function homeState(splitId, equip = 'full') {
  return { ...EMPTY, profile: profile(equip), currentSplitId: splitId }
}

function activeSession(splitId, dayId, dayLabel, items, cursor = 0, entries = []) {
  return {
    ...EMPTY,
    profile: profile('full'),
    currentSplitId: splitId,
    active: { splitId, dayId, dayLabel, cursor, plan: items, entries }
  }
}

// ---------- the matrix ----------
const SCENARIOS = {
  'onboarding_start': EMPTY,
  'home_full_body': homeState('full_body_3'),
  'home_upper_lower': homeState('upper_lower_4'),
  'home_ppl3': homeState('ppl_3'),
  'home_ppl6': homeState('ppl_6'),
  'home_bro': homeState('bro_5'),
  'home_ppl_ul': homeState('ppl_ul_5'),
  'home_full_body_bw': homeState('full_body_3', 'bodyweight'),
  'home_full_body_db': homeState('full_body_3', 'dumbbell'),

  'session_first_set': activeSession('full_body_3', 'fb_a', 'Full Body A', [
    { exerciseId: 'squat' },
    { exerciseId: 'bb_bench' },
    { exerciseId: 'bb_row' },
    { exerciseId: 'db_ohp' },
    { exerciseId: 'bb_curl' },
    { exerciseId: 'plank' }
  ], 0),

  'session_mid_bench': activeSession('full_body_3', 'fb_a', 'Full Body A', [
    { exerciseId: 'squat' },
    { exerciseId: 'bb_bench' },
    { exerciseId: 'bb_row' },
    { exerciseId: 'db_ohp' },
    { exerciseId: 'bb_curl' },
    { exerciseId: 'plank' }
  ], 1, [{ exerciseId: 'squat', status: 'done' }]),

  'session_pullup': activeSession('upper_lower_4', 'ul_ub', 'Upper B', [
    { exerciseId: 'pullup' },
    { exerciseId: 'incline_db' }
  ], 0),

  'session_deadlift': activeSession('upper_lower_4', 'ul_lb', 'Lower B', [
    { exerciseId: 'deadlift' }
  ], 0),

  'session_plank_sec': activeSession('full_body_3', 'fb_a', 'Full Body A', [
    { exerciseId: 'plank' }
  ], 0),

  // ---- per-pattern animation matrix ----
  'pat_squat': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'squat' }], 0),
  'pat_hinge': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'deadlift' }], 0),
  'pat_bench': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'bb_bench' }], 0),
  'pat_incline': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'incline_db' }], 0),
  'pat_ohp': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'ohp' }], 0),
  'pat_pushup': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'pushup' }], 0),
  'pat_row': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'bb_row' }], 0),
  'pat_pulldown': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'lat_pulldown' }], 0),
  'pat_pullup': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'pullup' }], 0),
  'pat_fly': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'cable_fly' }], 0),
  'pat_lateral': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'lat_raise' }], 0),
  'pat_lunge': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'lunge' }], 0),
  'pat_curl': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'bb_curl' }], 0),
  'pat_triceps': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'pushdown' }], 0),
  'pat_dip': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'dip' }], 0),
  'pat_hipthrust': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'hip_thrust' }], 0),
  'pat_legext': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'leg_ext' }], 0),
  'pat_legcurl': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'leg_curl' }], 0),
  'pat_plank': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'plank' }], 0),
  'pat_crunch': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'crunch' }], 0),
  'pat_legraise': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'hanging_leg_raise' }], 0),
  'pat_calf': activeSession('full_body_3', 'd', 'Test', [{ exerciseId: 'calf_raise' }], 0),

  // ---- home with recent workout (recovering ring) ----
  'home_recovering': (() => {
    const now = Date.now()
    return {
      ...EMPTY,
      profile: profile('full'),
      currentSplitId: 'upper_lower_4',
      lastWorkoutAt: now - 6 * 3600_000,
      history: [{
        splitId: 'upper_lower_4',
        dayId: 'ul_la', dayLabel: 'Lower A',
        at: now - 6 * 3600_000,
        entries: ['squat', 'rdl', 'leg_press', 'leg_curl', 'calf_raise', 'plank']
          .map(eid => ({ exerciseId: eid, status: 'done' }))
      }]
    }
  })(),

  // ---- home with units=lb ----
  'home_lb_units': {
    ...EMPTY,
    profile: { experience: 'intermediate', goal: 'muscle', daysPerWeek: 4, equipment: 'full', units: 'lb' },
    currentSplitId: 'upper_lower_4'
  },

  // ---- session with progress (suggested weight + targetReps) ----
  'session_with_progress': (() => {
    const s = activeSession('full_body_3', 'fb_a', 'Full Body A', [
      { exerciseId: 'squat' }, { exerciseId: 'bb_bench' }, { exerciseId: 'bb_row' },
      { exerciseId: 'db_ohp' }, { exerciseId: 'bb_curl' }, { exerciseId: 'plank' }
    ])
    s.progress = {
      squat: { suggestedWeight: 100, targetReps: 7, streak: 3, misses: 0 },
      bb_bench: { suggestedWeight: 60, targetReps: 8, streak: 2, misses: 0 }
    }
    return s
  })(),

  // ---- profile with lb units, in session ----
  'session_lb': (() => {
    const s = activeSession('full_body_3', 'fb_a', 'Full Body A', [
      { exerciseId: 'squat' }
    ])
    s.profile = { experience: 'intermediate', goal: 'muscle', daysPerWeek: 3, equipment: 'full', units: 'lb' }
    s.progress = { squat: { suggestedWeight: 225, targetReps: 6, streak: 2, misses: 0 } }
    return s
  })()
}

const want = process.argv[2]
if (!want || want === 'all') {
  for (const [k, v] of Object.entries(SCENARIOS)) {
    console.log(`\n--- ${k} ---`)
    writeState(v)
    launch()
    screenshot(k)
  }
} else if (SCENARIOS[want]) {
  writeState(SCENARIOS[want])
  launch()
  screenshot(want)
} else {
  console.error(`unknown scenario: ${want}`)
  console.error('available:', Object.keys(SCENARIOS).join(', '))
  process.exit(2)
}
