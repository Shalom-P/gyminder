import { useEffect, useState } from 'react'
import { getCoaching, PATTERNS } from '../data/coaching'
import { DEMO_MEDIA } from '../data/demoMedia'
import ExerciseAnimation from './ExerciseAnimation'

/**
 * Accurate exercise demonstration.
 *
 * Research (how Fitbod / JEFIT / Strong do it) shows an abstract stick figure
 * can't be biomechanically accurate — the trustworthy approach is real
 * demonstration media. We use the most-validated free source: the
 * public-domain free-exercise-db (yuhonas/free-exercise-db, Unlicense), playing
 * its start→end photos on a loop to show the actual movement.
 *
 * If a photo is missing or fails to load (e.g. offline), we fall back to the
 * generated stick-figure animation so a demo is always shown.
 */
export default function ExerciseDemo({
  exerciseId,
  label,
  clipOnly
}: {
  exerciseId: string
  label?: string
  clipOnly?: boolean
}) {
  const [photoFailed, setPhotoFailed] = useState(false)

  // Reset the failure flag when the exercise changes (state would otherwise
  // leak across exercises as Session reuses this component position).
  useEffect(() => {
    setPhotoFailed(false)
  }, [exerciseId])

  const info = getCoaching(exerciseId)
  const pat = info ? PATTERNS[info.pattern] : null
  const frames = DEMO_MEDIA[exerciseId]
  const usePhotos = !!frames && !photoFailed

  // Around the demo we surface the accurate, written content the app already
  // has: up to three concrete set-up cues as chips, plus the single most
  // important form cue highlighted as "Focus". The full step-by-step lives on
  // the "How to do it" detail screen.
  const focus = pat?.cues?.[0] ?? info?.setup?.[0] ?? null
  const setup = info?.setup?.slice(0, 3) ?? []

  const stage = usePhotos ? (
    <div className="demo-stage demo-stage-photo">
      <div className="demo-photos">
        <img
          className="demo-photo demo-photo-a"
          src={frames[0]}
          alt=""
          onError={() => setPhotoFailed(true)}
        />
        <img className="demo-photo demo-photo-b" src={frames[1]} alt="" />
        <span className="demo-tag" aria-hidden="true">
          ↻ Looping demo
        </span>
      </div>
    </div>
  ) : (
    <div className="demo-stage">
      <ExerciseAnimation exerciseId={exerciseId} label={label} />
    </div>
  )

  if (clipOnly) return stage

  return (
    <div className="demo-block">
      {stage}

      {setup.length > 0 && (
        <ul className="demo-setup" aria-label="Set-up">
          {setup.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}

      {focus && (
        <div className="demo-focus">
          <span className="demo-focus-k">Focus</span>
          <span className="demo-focus-v">{focus}</span>
        </div>
      )}
    </div>
  )
}
