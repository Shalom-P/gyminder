import type { CSSProperties } from 'react'
import type { Pattern } from '../data/coaching'
import { getCoaching } from '../data/coaching'

/**
 * Generated looping motion-graphic demo. One side-view skeletal rig is reused
 * for every exercise; each movement pattern supplies two poses (A↔B) and the
 * joints CSS-animate between them on an infinite alternating loop — no video
 * files, fully offline, respects prefers-reduced-motion.
 *
 * Rig (neutral = all zero = standing):
 *   hip (100,150) · shoulder (100,88) · elbow (100,120) · knee (100,196)
 * Rotations are in degrees (SVG clockwise-positive); root is a translateY px.
 */

interface Pose {
  root: number
  torso: number
  arm: number
  elbow: number
  hip: number
  knee: number
}

type Scene =
  | 'floor'
  | 'bench'
  | 'incline'
  | 'pullbar'
  | 'dipbars'
  | 'seat'
  | 'cable'
type Load = 'barbell' | 'dumbbell' | 'backbar' | 'none'

/**
 * Per-exercise visual overrides so two exercises that share a movement pattern
 * still look different (e.g. barbell-bench vs dumbbell-bench, cable row vs
 * barbell row). Only `scene` and `load` are differentiated — pose comes from
 * the pattern. Anything missing falls back to the pattern's SPEC defaults.
 */
const EXERCISE_ANIM: Record<string, { scene?: Scene; load?: Load }> = {
  // Chest
  db_bench: { load: 'dumbbell' },
  incline_bb: { load: 'barbell' },
  cable_fly: { scene: 'cable', load: 'none' },
  // Back
  db_row: { load: 'dumbbell' },
  inv_row: { load: 'none' },
  cable_row: { scene: 'cable', load: 'none' },
  face_pull: { scene: 'cable', load: 'none' },
  lat_pulldown: { scene: 'cable' },
  // Shoulders
  db_ohp: { load: 'dumbbell' },
  cable_lat_raise: { scene: 'cable', load: 'none' },
  rear_delt_fly: { scene: 'cable', load: 'none' },
  // Quads / legs
  goblet_squat: { load: 'dumbbell' },
  bw_squat: { load: 'none' },
  leg_press: { scene: 'seat', load: 'none' },
  bw_lunge: { load: 'none' },
  // Hams / glutes
  db_rdl: { load: 'dumbbell' },
  hip_bridge: { scene: 'floor', load: 'none' },
  // Biceps
  bb_curl: { load: 'barbell' },
  // Triceps
  pushdown: { scene: 'cable', load: 'none' },
  db_skullcrusher: { scene: 'bench', load: 'dumbbell' },
  overhead_ext: { load: 'dumbbell' },
  // Core
  cable_crunch: { scene: 'cable', load: 'none' },
  // Calves
  bw_calf_raise: { load: 'none' }
}

interface Spec {
  scene: Scene
  load: Load
  dur: number
  a: Pose
  b: Pose
  /** Static body orientation (deg). Used for prone/incline patterns so the
   *  figure actually lies on the bench / floor instead of standing. */
  bodyRot?: number
  /** Static Y shift applied with the rotation so the rotated body lands on
   *  the right scene element. */
  bodyDy?: number
}

const P = (
  root: number,
  torso: number,
  arm: number,
  elbow: number,
  hip: number,
  knee: number
): Pose => ({ root, torso, arm, elbow, hip, knee })

/**
 * Body orientations: bodyRot is a static outer rotation applied around the
 * hip (100,150). For prone/lying patterns this lays the figure across the
 * bench or floor so the side-view actually reads as the right movement.
 * bodyDy slides the rotated figure onto the correct scene element.
 *
 *   bodyRot = -90  → head points LEFT, feet point RIGHT, body horizontal.
 *   Inside a -90 rotation, joint rotations still work in the figure's local
 *   frame: arm angle -70° (originally "arm out front") becomes "arm extended
 *   away from the bench" — i.e. the press-up direction. So existing arm/leg
 *   poses still drive the rep correctly after rotation.
 */
const SPECS: Record<Pattern, Spec> = {
  squat: { scene: 'floor', load: 'backbar', dur: 2.6, a: P(0, 8, 16, -14, 0, 0), b: P(34, 26, 16, -14, 80, -92) },
  hinge: { scene: 'floor', load: 'barbell', dur: 2.6, a: P(0, 6, 4, 0, 0, 0), b: P(8, 66, 8, 0, 16, -20) },

  // ---- Lying patterns: body rotated -90 so figure is on its back / prone
  bench: {
    scene: 'bench', load: 'barbell', dur: 2.4, bodyRot: -90, bodyDy: 20,
    a: P(0, 0, -90, -82, 0, 0), b: P(0, 0, -90, 0, 0, 0)
  },
  incline: {
    scene: 'incline', load: 'dumbbell', dur: 2.4, bodyRot: -55, bodyDy: 12,
    a: P(0, 0, -90, -76, 0, 0), b: P(0, 0, -90, -6, 0, 0)
  },
  fly: {
    scene: 'bench', load: 'dumbbell', dur: 2.6, bodyRot: -90, bodyDy: 20,
    a: P(0, 0, -90, -60, 0, 0), b: P(0, 0, -90, -10, 0, 0)
  },
  pushup: {
    scene: 'floor', load: 'none', dur: 2.2, bodyRot: -90, bodyDy: 78,
    a: P(0, 0, -90, -8, 0, 0), b: P(0, 0, -90, -70, 0, 0)
  },
  plank: {
    scene: 'floor', load: 'none', dur: 3.6, bodyRot: -90, bodyDy: 78,
    a: P(0, 0, -90, -88, 0, 0), b: P(2, 0, -90, -88, 0, 0)
  },
  crunch: {
    scene: 'floor', load: 'none', dur: 2.4, bodyRot: -90, bodyDy: 78,
    a: P(0, 0, 0, -10, 70, -90), b: P(0, 38, 0, -10, 70, -90)
  },
  hipthrust: {
    scene: 'bench', load: 'backbar', dur: 2.4, bodyRot: -90, bodyDy: 20,
    a: P(14, 0, 0, 0, 70, -76), b: P(-4, 0, 0, 0, 30, -64)
  },

  // ---- Upright patterns ----
  ohp: { scene: 'floor', load: 'barbell', dur: 2.4, a: P(0, 4, -92, -70, 0, 0), b: P(0, 4, -172, -6, 0, 0) },
  row: { scene: 'floor', load: 'barbell', dur: 2.4, a: P(0, 52, 26, -6, 8, -8), b: P(0, 52, -4, -104, 8, -8) },
  pulldown: { scene: 'seat', load: 'none', dur: 2.4, a: P(0, -8, -150, -18, 82, -86), b: P(0, -8, -104, -66, 82, -86) },
  pullup: { scene: 'pullbar', load: 'none', dur: 2.6, a: P(36, 2, -160, -12, 6, -8), b: P(2, 2, -160, -118, 6, -8) },
  lateral: { scene: 'floor', load: 'dumbbell', dur: 2.2, a: P(0, 4, 16, -8, 0, 0), b: P(0, 4, -84, -8, 0, 0) },
  lunge: { scene: 'floor', load: 'dumbbell', dur: 2.6, a: P(0, 6, 20, -10, 8, -10), b: P(30, 8, 20, -10, 60, -104) },
  curl: { scene: 'floor', load: 'dumbbell', dur: 2.2, a: P(0, 4, 8, -6, 0, 0), b: P(0, 4, 8, -138, 0, 0) },
  triceps: { scene: 'floor', load: 'none', dur: 2.0, a: P(0, 4, 14, -96, 0, 0), b: P(0, 4, 14, -6, 0, 0) },
  dip: { scene: 'dipbars', load: 'none', dur: 2.4, a: P(0, 12, -12, -8, 4, -6), b: P(26, 16, -12, -86, 4, -6) },
  legext: { scene: 'seat', load: 'none', dur: 2.0, a: P(0, 2, 20, -10, 85, -92), b: P(0, 2, 20, -10, 85, -4) },
  legcurl: { scene: 'floor', load: 'none', dur: 2.2, a: P(0, 4, 8, -6, 2, -4), b: P(0, 4, 8, -6, 2, -104) },
  legraise: { scene: 'pullbar', load: 'none', dur: 2.6, a: P(6, 2, -160, -10, 4, -8), b: P(6, 2, -160, -10, -78, -30) },
  calf: { scene: 'floor', load: 'backbar', dur: 1.6, a: P(7, 4, 16, -10, 0, 0), b: P(-6, 4, 16, -10, 0, 2) }
}

function jointStyle(
  ox: number,
  oy: number,
  a: number,
  b: number,
  dur: number
): CSSProperties {
  return {
    transformOrigin: `${ox}px ${oy}px`,
    ['--f' as string]: `rotate(${a}deg)`,
    ['--t' as string]: `rotate(${b}deg)`,
    ['--dur' as string]: `${dur}s`
  } as CSSProperties
}

function rootStyle(a: number, b: number, dur: number): CSSProperties {
  return {
    ['--f' as string]: `translateY(${a}px)`,
    ['--t' as string]: `translateY(${b}px)`,
    ['--dur' as string]: `${dur}s`
  } as CSSProperties
}

function Scenery({ scene }: { scene: Scene }) {
  switch (scene) {
    case 'floor':
      return <line className="scene" x1={28} y1={243} x2={196} y2={243} />
    case 'bench':
      return (
        <>
          <line className="scene" x1={28} y1={243} x2={196} y2={243} />
          <rect className="scene" x={70} y={170} width={96} height={10} rx={4} fill="none" />
          <line className="scene" x1={80} y1={180} x2={80} y2={210} />
          <line className="scene" x1={156} y1={180} x2={156} y2={210} />
        </>
      )
    case 'incline':
      return (
        <>
          <line className="scene" x1={28} y1={243} x2={196} y2={243} />
          <line className="scene" x1={70} y1={210} x2={150} y2={150} />
        </>
      )
    case 'pullbar':
      return <line className="scene" x1={50} y1={22} x2={170} y2={22} />
    case 'dipbars':
      return (
        <>
          <line className="scene" x1={48} y1={150} x2={92} y2={150} />
          <line className="scene" x1={128} y1={150} x2={172} y2={150} />
        </>
      )
    case 'seat':
      return (
        <>
          <line className="scene" x1={28} y1={243} x2={196} y2={243} />
          <rect className="scene" x={86} y={188} width={70} height={10} rx={3} fill="none" />
        </>
      )
    case 'cable':
      return (
        <>
          <line className="scene" x1={28} y1={243} x2={196} y2={243} />
          <line className="scene" x1={194} y1={36} x2={194} y2={240} />
          <line className="scene" x1={170} y1={36} x2={194} y2={36} />
          <circle className="scene" cx={180} cy={36} r={5} fill="none" />
        </>
      )
  }
}

function Load({ kind }: { kind: Load }) {
  if (kind === 'none') return null
  if (kind === 'barbell')
    return <line className="imp" x1={66} y1={150} x2={134} y2={150} />
  if (kind === 'dumbbell')
    return (
      <>
        <line className="imp" x1={92} y1={150} x2={108} y2={150} />
        <circle className="head" cx={100} cy={150} r={5} />
      </>
    )
  // backbar: drawn at the shoulders, handled separately
  return null
}

export default function ExerciseAnimation({
  exerciseId,
  pattern,
  label
}: {
  exerciseId?: string
  pattern?: Pattern
  label?: string
}) {
  const resolvedPattern: Pattern | undefined =
    pattern ?? (exerciseId ? getCoaching(exerciseId)?.pattern : undefined)
  if (!resolvedPattern) return null
  const s = SPECS[resolvedPattern]
  const override = exerciseId ? EXERCISE_ANIM[exerciseId] : undefined
  const scene: Scene = override?.scene ?? s.scene
  const load: Load = override?.load ?? s.load
  const { a, b, dur } = s
  const bodyRot = s.bodyRot ?? 0
  const bodyDy = s.bodyDy ?? 0
  const bodyTransform =
    bodyRot || bodyDy
      ? `translate(0px, ${bodyDy}px) rotate(${bodyRot}deg)`
      : undefined

  return (
    <svg
      className="exa"
      viewBox="0 0 220 260"
      role="img"
      aria-label={label ? `Animated demo: ${label}` : 'Animated exercise demo'}
    >
      <Scenery scene={scene} />
      <g
        style={
          bodyTransform
            ? { transform: bodyTransform, transformOrigin: '100px 150px', transformBox: 'view-box' }
            : undefined
        }
      >
      <g className="exa-root" style={rootStyle(a.root, b.root, dur)}>
        {/* torso + arm chain, pivots at the hip */}
        <g className="exa-j" style={jointStyle(100, 150, a.torso, b.torso, dur)}>
          <line x1={100} y1={150} x2={100} y2={88} />
          <circle className="head" cx={100} cy={70} r={14} />
          {load === 'backbar' && (
            <line className="imp" x1={72} y1={86} x2={128} y2={86} />
          )}
          <g
            className="exa-j"
            style={jointStyle(100, 88, a.arm, b.arm, dur)}
          >
            <line x1={100} y1={88} x2={100} y2={120} />
            <g
              className="exa-j"
              style={jointStyle(100, 120, a.elbow, b.elbow, dur)}
            >
              <line x1={100} y1={120} x2={100} y2={150} />
              <Load kind={load} />
            </g>
          </g>
        </g>
        {/* leg chain, pivots at the hip */}
        <g className="exa-j" style={jointStyle(100, 150, a.hip, b.hip, dur)}>
          <line x1={100} y1={150} x2={100} y2={196} />
          <g
            className="exa-j"
            style={jointStyle(100, 196, a.knee, b.knee, dur)}
          >
            <line x1={100} y1={196} x2={100} y2={238} />
            <line x1={100} y1={238} x2={120} y2={238} />
          </g>
        </g>
      </g>
      </g>
    </svg>
  )
}
