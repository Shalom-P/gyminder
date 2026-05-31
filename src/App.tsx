import { useState } from 'react'
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

export default function App() {
  const { state } = useStore()
  const [view, setView] = useState<View>(state.active ? 'session' : 'home')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailReturn, setDetailReturn] = useState<View>('home')

  function openDetail(id: string, from: View) {
    setDetailId(id)
    setDetailReturn(from)
    setView('detail')
  }

  if (!state.profile) return <Onboarding />

  if (view === 'builder') {
    return (
      <ScheduleBuilder
        onBack={() => setView('mode')}
        onDone={() => setView('home')}
      />
    )
  }

  if (!state.currentSplitId) {
    return (
      <ModeSelect
        onPicked={() => setView('home')}
        onBuild={() => setView('builder')}
      />
    )
  }

  if (view === 'detail' && detailId) {
    return (
      <ExerciseDetail
        exerciseId={detailId}
        onBack={() => setView(detailReturn)}
      />
    )
  }

  if (view === 'library') {
    return (
      <Library
        onBack={() => setView('settings')}
        onOpen={(id) => openDetail(id, 'library')}
      />
    )
  }

  if (view === 'pick') {
    return (
      <WorkoutPicker
        onBack={() => setView('home')}
        onStarted={() => setView('session')}
      />
    )
  }

  if (view === 'session') {
    if (!state.active)
      return (
        <Home
          onStart={() => setView('session')}
          onSettings={() => setView('settings')}
          onPick={() => setView('pick')}
        />
      )
    return (
      <Session
        onComplete={() => setView('complete')}
        onQuit={() => setView('home')}
        onShowHow={(id) => openDetail(id, 'session')}
      />
    )
  }

  if (view === 'complete') {
    return <Complete onHome={() => setView('home')} />
  }

  if (view === 'settings') {
    return (
      <Settings
        onBack={() => setView('home')}
        onChangeMode={() => setView('mode')}
        onLibrary={() => setView('library')}
      />
    )
  }

  if (view === 'mode') {
    return (
      <ModeSelect
        onBack={() => setView('home')}
        onPicked={() => setView('home')}
        onBuild={() => setView('builder')}
      />
    )
  }

  return (
    <Home
      onStart={() => setView('session')}
      onSettings={() => setView('settings')}
      onPick={() => setView('pick')}
    />
  )
}
