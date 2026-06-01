import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode
} from 'react'
import { useStore } from './state/store'
import Onboarding from './screens/Onboarding'
import ModeSelect from './screens/ModeSelect'
import Home from './screens/Home'
import Session from './screens/Session'
import Complete from './screens/Complete'
import Settings from './screens/Settings'
import ExerciseDetail from './screens/ExerciseDetail'
import Library from './screens/Library'
import ScheduleBuilder from './screens/ScheduleBuilder'
import WorkoutPicker from './screens/WorkoutPicker'
import TabBar, { type TabId } from './components/TabBar'

type View =
  | 'home'
  | 'session'
  | 'complete'
  | 'settings'
  | 'mode'
  | 'library'
  | 'detail'
  | 'builder'
  | 'pick'

const TAB_VIEWS: Record<string, true> = {
  home: true,
  library: true,
  settings: true
}

/* ---- navigation stack: coordinated push / pop / fade transitions ----
   Keeps the outgoing screen on as a frozen DOM snapshot while the incoming one
   animates, and infers direction from a depth map so forward and back feel
   different. Ported from the Claude Design prototype. */
const NAV_DEPTH: Record<string, number> = {
  onboarding: 0,
  home: 1,
  library: 1,
  settings: 1,
  mode: 2,
  pick: 2,
  builder: 3,
  session: 3,
  complete: 4,
  detail: 5
}
function depthOf(id: string): number {
  const k = id.includes(':') ? id.slice(0, id.indexOf(':')) : id
  return NAV_DEPTH[k] != null ? NAV_DEPTH[k] : 1
}

type ExitSnapshot = {
  html: string
  scrolls: number[]
  dir: string
  token: number
}

function NavStack({
  screenId,
  children
}: {
  screenId: string
  children: ReactNode
}) {
  const liveRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(screenId)
  const dirRef = useRef<string | null>(null)
  const exitRef = useRef<ExitSnapshot | null>(null)
  const tokenRef = useRef(0)
  const [, bump] = useState(0)

  // Detect a screen change during render and snapshot the outgoing DOM
  // (liveRef still holds the previous, un-committed screen at this point).
  if (idRef.current !== screenId) {
    const dn = depthOf(screenId)
    const dp = depthOf(idRef.current)
    const dir = dn > dp ? 'push' : dn < dp ? 'pop' : 'fade'
    const node = liveRef.current
    const html = node ? node.innerHTML : ''
    const scrolls: number[] = []
    if (node) {
      const sc = node.querySelectorAll<HTMLElement>('.scroll')
      for (let i = 0; i < sc.length; i++) scrolls.push(sc[i].scrollTop)
    }
    tokenRef.current += 1
    dirRef.current = dir
    exitRef.current = { html, scrolls, dir, token: tokenRef.current }
    idRef.current = screenId
  }

  const exit = exitRef.current
  const liveDir = dirRef.current
  const token = tokenRef.current

  useLayoutEffect(() => {
    if (!exit) return
    // Restore the outgoing screen's scroll positions onto the frozen snapshot.
    const ex = document.getElementById('nav-exit-' + exit.token)
    if (ex) {
      const sc = ex.querySelectorAll<HTMLElement>('.scroll')
      for (let i = 0; i < sc.length && i < exit.scrolls.length; i++)
        sc[i].scrollTop = exit.scrolls[i]
    }
    const tk = exit.token
    const dur = exit.dir === 'fade' ? 340 : 500
    const to = window.setTimeout(() => {
      // settle: drop the snapshot AND return the live layer to a plain,
      // un-composited resting state (clears will-change + finished animation).
      if (exitRef.current && exitRef.current.token === tk) {
        exitRef.current = null
        dirRef.current = null
        bump((n) => n + 1)
      }
    }, dur)
    return () => window.clearTimeout(to)
  }, [exit])

  return (
    <div className="nav-stack">
      {exit ? (
        <div
          id={'nav-exit-' + exit.token}
          className={'nav-exit nav-animating dir-' + exit.dir}
          dangerouslySetInnerHTML={{ __html: exit.html }}
        />
      ) : null}
      <div
        key={'live-' + token}
        ref={liveRef}
        className={'nav-live' + (liveDir ? ' nav-animating dir-' + liveDir : '')}
      >
        {children}
      </div>
    </div>
  )
}

export default function App() {
  const { state } = useStore()

  // Drive light/dark off the persisted theme. Applied to <html> (it sits above
  // the app root, so the body surface + safe-area chrome pick it up too).
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  const [view, setView] = useState<View>(state.active ? 'session' : 'home')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailReturn, setDetailReturn] = useState<View>('home')

  function openDetail(id: string, from: View) {
    setDetailId(id)
    setDetailReturn(from)
    setView('detail')
  }

  let content: ReactNode
  let showTabs = false
  let screenId = 'home'

  if (!state.profile) {
    screenId = 'onboarding'
    content = <Onboarding />
  } else if (view === 'builder') {
    screenId = 'builder'
    content = (
      <ScheduleBuilder
        onBack={() => setView('mode')}
        onDone={() => setView('home')}
      />
    )
  } else if (!state.currentSplitId) {
    screenId = 'mode'
    content = (
      <ModeSelect
        onPicked={() => setView('home')}
        onBuild={() => setView('builder')}
      />
    )
  } else if (view === 'detail' && detailId) {
    screenId = 'detail:' + detailId
    content = (
      <ExerciseDetail
        exerciseId={detailId}
        onBack={() => setView(detailReturn)}
      />
    )
  } else if (view === 'pick') {
    screenId = 'pick'
    content = (
      <WorkoutPicker
        onBack={() => setView('home')}
        onStarted={() => setView('session')}
      />
    )
  } else if (view === 'session') {
    if (!state.active) {
      showTabs = true
      screenId = 'home'
      content = (
        <Home onStart={() => setView('session')} onPick={() => setView('pick')} />
      )
    } else {
      screenId = 'session'
      content = (
        <Session
          onComplete={() => setView('complete')}
          onQuit={() => setView('home')}
          onShowHow={(id) => openDetail(id, 'session')}
        />
      )
    }
  } else if (view === 'complete') {
    screenId = 'complete'
    content = <Complete onHome={() => setView('home')} />
  } else if (view === 'mode') {
    screenId = 'mode'
    content = (
      <ModeSelect
        onBack={() => setView('home')}
        onPicked={() => setView('home')}
        onBuild={() => setView('builder')}
      />
    )
  } else if (view === 'library') {
    showTabs = true
    screenId = 'library'
    content = <Library onOpen={(id) => openDetail(id, 'library')} />
  } else if (view === 'settings') {
    showTabs = true
    screenId = 'settings'
    content = <Settings onChangeMode={() => setView('mode')} />
  } else {
    showTabs = true
    screenId = 'home'
    content = (
      <Home onStart={() => setView('session')} onPick={() => setView('pick')} />
    )
  }

  // Which tab is highlighted — none while an active session is on screen.
  const activeTab: TabId | null =
    view === 'session' && state.active
      ? null
      : ((TAB_VIEWS[view] ? view : 'home') as TabId)

  return (
    <div className={`app${showTabs ? ' has-tabbar' : ''}`}>
      <div className="gym-stack">
        <NavStack screenId={screenId}>{content}</NavStack>
      </div>
      {showTabs && <TabBar active={activeTab} onSelect={(id) => setView(id)} />}
    </div>
  )
}
