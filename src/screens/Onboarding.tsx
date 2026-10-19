import { useState } from 'react'
import type {
  Equipment,
  Experience,
  Goal,
  Profile,
  WeightUnit
} from '../types'
import { useStore } from '../state/store'

type Draft = Partial<Profile>

interface Step {
  key: keyof Profile
  title: string
  sub: string
  options: Array<{ label: string; hint: string; value: string | number }>
}

const STEPS: Step[] = [
  {
    key: 'experience',
    title: 'How experienced are you?',
    sub: 'Sets your starting volume and the plan we recommend.',
    options: [
      { label: 'Beginner', hint: 'New or returning to lifting', value: 'beginner' },
      { label: 'Intermediate', hint: 'Training consistently 6+ months', value: 'intermediate' },
      { label: 'Advanced', hint: 'Years of structured training', value: 'advanced' }
    ]
  },
  {
    key: 'goal',
    title: "What's your main goal?",
    sub: 'Sets your rep ranges and rest times.',
    options: [
      { label: 'Build muscle', hint: 'Hypertrophy focus', value: 'muscle' },
      { label: 'Get stronger', hint: 'Strength focus', value: 'strength' },
      { label: 'General fitness', hint: 'Stay fit and healthy', value: 'general' }
    ]
  },
  {
    key: 'daysPerWeek',
    title: 'Days per week?',
    sub: 'We use this to recommend a training mode.',
    options: [
      { label: '3 days', hint: 'Full body', value: 3 },
      { label: '4 days', hint: 'Upper / Lower', value: 4 },
      { label: '5 days', hint: 'Push / pull / legs + upper / lower', value: 5 },
      { label: '6 days', hint: 'Push / pull / legs, twice', value: 6 }
    ]
  },
  {
    key: 'equipment',
    title: 'What equipment do you have?',
    sub: 'Exercises auto-swap to fit. Missing something? Tap Swap mid-workout.',
    options: [
      { label: 'Full gym', hint: 'Barbells, machines, cables', value: 'full' },
      { label: 'Dumbbells', hint: 'Dumbbells and a bench; a pull-up bar helps', value: 'dumbbell' },
      { label: 'Bodyweight + bar', hint: 'A pull-up bar, dip bars or rings', value: 'bodyweight' },
      { label: 'No equipment', hint: 'Just you and a chair; back work is limited', value: 'none' }
    ]
  },
  {
    key: 'units',
    title: 'Preferred weight units?',
    sub: 'Used everywhere weights are shown.',
    options: [
      { label: 'Kilograms', hint: 'kg', value: 'kg' },
      { label: 'Pounds', hint: 'lb', value: 'lb' }
    ]
  }
]

export default function Onboarding() {
  const { onboard } = useStore()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>({})

  const current = STEPS[step]

  function choose(value: string | number) {
    const next: Draft = { ...draft, [current.key]: value }
    if (step === STEPS.length - 1) {
      onboard({
        experience: next.experience as Experience,
        goal: next.goal as Goal,
        daysPerWeek: next.daysPerWeek as number,
        equipment: next.equipment as Equipment,
        units: (next.units as WeightUnit) ?? 'kg'
      })
      return
    }
    setDraft(next)
    setStep(step + 1)
  }

  return (
    <div className="frame push" key={step}>
      <div className="top">
        <span className="brand center">Gyminder setup</span>
        <span />
        <div className="dots">
          {STEPS.map((_, i) => (
            <i
              key={i}
              className={i === step ? 'on' : i < step ? 'done' : ''}
            />
          ))}
        </div>
      </div>
      <div className="body">
        <div className="screen-head reveal">
          <span className="eyebrow">
            Step {step + 1} of {STEPS.length}
          </span>
          <h1 className="h1">{current.title}</h1>
          <p className="muted">{current.sub}</p>
        </div>
        <div className="spacer" />
        <div className="list reveal">
          {current.options.map((o) => (
            <button
              key={String(o.value)}
              className="choice"
              onClick={() => choose(o.value)}
            >
              <span className="title">{o.label}</span>
              <span className="muted">{o.hint}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
