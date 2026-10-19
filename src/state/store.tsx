import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode
} from 'react'
import type {
  AppState,
  Profile,
  SessionEntry,
  Settings,
  Split,
  SplitDay,
  ThemeMode
} from '../types'
import { CUSTOM_SPLIT_ID } from '../types'
import { EXERCISES, getExercise } from '../data/exercises'
import { getActiveSplit } from '../data/splits'
import {
  applyResult,
  buildPlan,
  initProgress,
  prescribe
} from '../engine/progression'
import { rememberSwap } from '../engine/alternatives'
import { upcomingDay } from '../engine/schedule'

const STORAGE_KEY = 'gymapp.v1'

export const EMPTY: AppState = {
  profile: null,
  currentSplitId: null,
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

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<AppState>) }
  } catch {
    return EMPTY
  }
}

export type Action =
  | { type: 'onboard'; profile: Profile }
  | { type: 'setSplit'; id: string }
  | { type: 'setTargets'; patch: Partial<Settings> }
  | { type: 'setTheme'; theme: ThemeMode }
  | { type: 'setCustomSplit'; split: Split }
  | { type: 'start' }
  | { type: 'startDay'; dayId: string }
  | { type: 'mark'; status: 'done' | 'skip'; reps?: number; weight?: number }
  | { type: 'advanceSet'; restEndsAt: number }
  | { type: 'setRest'; restEndsAt: number | null }
  | { type: 'swapExercise'; toId: string; remember: boolean }
  | { type: 'clearSwap'; fromId: string }
  | { type: 'abandon' }
  | { type: 'resetAll' }
  | { type: 'redoSetup' }

function finalize(state: AppState, entries: SessionEntry[]): AppState {
  const a = state.active
  if (!a) return state
  const progress = { ...state.progress }
  for (const e of entries) {
    const base = EXERCISES[e.exerciseId]
    if (!base) continue // tolerate ids removed by a later data update
    const ex = prescribe(base, state.profile)
    const prev = progress[e.exerciseId] ?? initProgress(ex)
    progress[e.exerciseId] = applyResult(prev, ex, e, state.profile?.units)
  }
  const split = getActiveSplit(state)
  const dayCount = split && split.days.length ? split.days.length : 1
  const now = Date.now()
  return {
    ...state,
    progress,
    history: [
      ...state.history,
      {
        splitId: a.splitId,
        dayId: a.dayId,
        dayLabel: a.dayLabel,
        at: now,
        entries
      }
    ].slice(-200),
    lastWorkoutAt: now,
    rotationIndex: (state.rotationIndex + 1) % dayCount,
    active: null
  }
}

/** Build the active session for a specific day (used by start & startDay). */
function beginSession(state: AppState, day: SplitDay): AppState {
  if (!state.profile || !state.currentSplitId) return state
  const { items, resetMisses } = buildPlan(
    day,
    state.profile,
    state.progress,
    state.swaps
  )
  if (!items.length) return state
  const progress = { ...state.progress }
  for (const id of resetMisses) {
    const base = progress[id] ?? initProgress(getExercise(id))
    progress[id] = { ...base, misses: 0 }
  }
  return {
    ...state,
    progress,
    active: {
      splitId: state.currentSplitId,
      dayId: day.id,
      dayLabel: day.label,
      cursor: 0,
      plan: items,
      entries: [],
      setIdx: 0,
      restEndsAt: null
    }
  }
}

/** Exported for the engine test scripts; components go through useStore(). */
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'onboard':
      return { ...state, profile: action.profile }

    case 'setSplit':
      return {
        ...state,
        currentSplitId: action.id,
        rotationIndex: 0,
        active: null
      }

    case 'setTargets':
      return { ...state, settings: { ...state.settings, ...action.patch } }

    case 'setTheme':
      return { ...state, theme: action.theme }

    case 'setCustomSplit':
      return {
        ...state,
        customSplit: action.split,
        currentSplitId: CUSTOM_SPLIT_ID,
        rotationIndex: 0,
        active: null
      }

    case 'start': {
      const day = upcomingDay(state)
      if (!day) return state
      return beginSession(state, day)
    }

    case 'startDay': {
      const split = getActiveSplit(state)
      const day = split?.days.find((d) => d.id === action.dayId)
      if (!day) return state
      return beginSession(state, day)
    }

    case 'mark': {
      const a = state.active
      if (!a || a.cursor >= a.plan.length) return state
      const item = a.plan[a.cursor]
      const entry: SessionEntry = {
        exerciseId: item.exerciseId,
        status: action.status
      }
      if (action.status === 'done') {
        if (typeof action.reps === 'number') entry.reps = action.reps
        if (typeof action.weight === 'number') entry.weight = action.weight
        // Logged on the last set, so the set index gives the sets performed —
        // the volume the recovery estimate reads.
        entry.sets = (a.setIdx ?? 0) + 1
      }
      const entries = [...a.entries, entry]
      const advanced: AppState = {
        ...state,
        // Next exercise starts fresh: back to set 1, no carried-over rest.
        active: { ...a, cursor: a.cursor + 1, entries, setIdx: 0, restEndsAt: null }
      }
      // Last exercise just logged — finalize the session in one step so the
      // history record is ready before the Complete screen renders.
      if (a.cursor + 1 >= a.plan.length) return finalize(advanced, entries)
      return advanced
    }

    case 'advanceSet': {
      const a = state.active
      if (!a) return state
      return {
        ...state,
        active: { ...a, setIdx: (a.setIdx ?? 0) + 1, restEndsAt: action.restEndsAt }
      }
    }

    case 'setRest': {
      const a = state.active
      if (!a) return state
      return { ...state, active: { ...a, restEndsAt: action.restEndsAt } }
    }

    case 'swapExercise': {
      // Replace the current exercise (the user lacks the kit, or the station is
      // taken). Keyed by what the slot originally held, so a swap of a swap —
      // or of a skip-swap — still reads "instead of <original>, do <this>".
      // Picking the original back restores it. The new lift starts at set 1.
      const a = state.active
      if (!a) return state
      const item = a.plan[a.cursor]
      if (!item || !EXERCISES[action.toId] || action.toId === item.exerciseId)
        return state
      const origin = item.from ?? item.exerciseId
      const back = action.toId === origin
      const plan = a.plan.slice()
      plan[a.cursor] = back
        ? { exerciseId: origin }
        : { exerciseId: action.toId, from: origin }
      let swaps = state.swaps
      if (action.remember) {
        if (back) {
          swaps = { ...swaps }
          delete swaps[origin]
        } else {
          swaps = rememberSwap(swaps, origin, action.toId)
        }
      }
      return {
        ...state,
        swaps,
        active: { ...a, plan, setIdx: 0, restEndsAt: null }
      }
    }

    case 'clearSwap': {
      if (!(action.fromId in state.swaps)) return state
      const swaps = { ...state.swaps }
      delete swaps[action.fromId]
      return { ...state, swaps }
    }

    case 'abandon':
      return { ...state, active: null }

    case 'resetAll':
      return EMPTY

    case 'redoSetup':
      return { ...state, profile: null, active: null }

    default:
      return state
  }
}

interface Store {
  state: AppState
  onboard: (p: Profile) => void
  setSplit: (id: string) => void
  setTargets: (patch: Partial<Settings>) => void
  setTheme: (theme: ThemeMode) => void
  setCustomSplit: (split: Split) => void
  start: () => void
  startDay: (dayId: string) => void
  mark: (status: 'done' | 'skip', reps?: number, weight?: number) => void
  advanceSet: (restEndsAt: number) => void
  setRest: (restEndsAt: number | null) => void
  swapExercise: (toId: string, remember: boolean) => void
  clearSwap: (fromId: string) => void
  abandon: () => void
  resetAll: () => void
  redoSetup: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage full or unavailable — app still works in-memory */
    }
  }, [state])

  const store = useMemo<Store>(
    () => ({
      state,
      onboard: (profile) => dispatch({ type: 'onboard', profile }),
      setSplit: (id) => dispatch({ type: 'setSplit', id }),
      setTargets: (patch) => dispatch({ type: 'setTargets', patch }),
      setTheme: (theme) => dispatch({ type: 'setTheme', theme }),
      setCustomSplit: (split) => dispatch({ type: 'setCustomSplit', split }),
      start: () => dispatch({ type: 'start' }),
      startDay: (dayId) => dispatch({ type: 'startDay', dayId }),
      mark: (status, reps, weight) =>
        dispatch({ type: 'mark', status, reps, weight }),
      advanceSet: (restEndsAt) => dispatch({ type: 'advanceSet', restEndsAt }),
      setRest: (restEndsAt) => dispatch({ type: 'setRest', restEndsAt }),
      swapExercise: (toId, remember) =>
        dispatch({ type: 'swapExercise', toId, remember }),
      clearSwap: (fromId) => dispatch({ type: 'clearSwap', fromId }),
      abandon: () => dispatch({ type: 'abandon' }),
      resetAll: () => dispatch({ type: 'resetAll' }),
      redoSetup: () => dispatch({ type: 'redoSetup' })
    }),
    [state]
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used within StoreProvider')
  return s
}
