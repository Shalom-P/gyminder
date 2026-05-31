import { useLayoutEffect, useState } from 'react'
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

  let content: React.ReactNode
  let showTabs = false

  if (!state.profile) {
    content = <Onboarding />
  } else if (view === 'builder') {
    content = (
      <ScheduleBuilder
        onBack={() => setView('mode')}
        onDone={() => setView('home')}
      />
    )
  } else if (!state.currentSplitId) {
    content = (
      <ModeSelect
        onPicked={() => setView('home')}
        onBuild={() => setView('builder')}
      />
    )
  } else if (view === 'detail' && detailId) {
    content = (
      <ExerciseDetail
        exerciseId={detailId}
        onBack={() => setView(detailReturn)}
      />
    )
  } else if (view === 'pick') {
    content = (
      <WorkoutPicker
        onBack={() => setView('home')}
        onStarted={() => setView('session')}
      />
    )
  } else if (view === 'session') {
    if (!state.active) {
      showTabs = true
      content = (
        <Home onStart={() => setView('session')} onPick={() => setView('pick')} />
      )
    } else {
      content = (
        <Session
          onComplete={() => setView('complete')}
          onQuit={() => setView('home')}
          onShowHow={(id) => openDetail(id, 'session')}
        />
      )
    }
  } else if (view === 'complete') {
    content = <Complete onHome={() => setView('home')} />
  } else if (view === 'mode') {
    content = (
      <ModeSelect
        onBack={() => setView('home')}
        onPicked={() => setView('home')}
        onBuild={() => setView('builder')}
      />
    )
  } else if (view === 'library') {
    showTabs = true
    content = <Library onOpen={(id) => openDetail(id, 'library')} />
  } else if (view === 'settings') {
    showTabs = true
    content = <Settings onChangeMode={() => setView('mode')} />
  } else {
    showTabs = true
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
      {content}
      {showTabs && <TabBar active={activeTab} onSelect={(id) => setView(id)} />}
    </div>
  )
}
