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
import { applyResult, buildPlan, initProgress } from '../engine/progression'
import { upcomingDay } from '../engine/schedule'

const STORAGE_KEY = 'gymapp.v1'

const EMPTY: AppState = {
  profile: null,
  currentSplitId: null,
  rotationIndex: 0,
  progress: {},
  history: [],
  lastWorkoutAt: null,
  active: null,
  customSplit: null,
  settings: { custom: false, sets: 3, reps: 8 },
  theme: 'dark'
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

type Action =
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
  | { type: 'abandon' }
  | { type: 'resetAll' }
  | { type: 'redoSetup' }

function finalize(state: AppState, entries: SessionEntry[]): AppState {
  const a = state.active
  if (!a) return state
  const progress = { ...state.progress }
  for (const e of entries) {
    const ex = EXERCISES[e.exerciseId]
    if (!ex) continue // tolerate ids removed by a later data update
    const prev = progress[e.exerciseId] ?? initProgress(ex)
    progress[e.exerciseId] = applyResult(prev, ex, e)
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
  const { items, resetMisses } = buildPlan(day, state.profile, state.progress)
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

function reducer(state: AppState, action: Action): AppState {
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
