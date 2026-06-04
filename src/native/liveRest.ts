import { Capacitor, registerPlugin } from '@capacitor/core'

export type RestPhase = 'resting' | 'almostUp' | 'lifting'

export interface LiveRestState {
  phase: RestPhase
  /** Wall-clock ms when the current rest ends; omit/null while a set is active. */
  endsAt?: number | null
  /** 1-based index of the upcoming/active set. */
  setIndex: number
  setTotal: number
  exerciseName: string
  dayLabel: string
}

interface LiveRestPlugin {
  update(state: LiveRestState): Promise<{ ok: boolean; reason?: string }>
  end(): Promise<void>
}

const Native = registerPlugin<LiveRestPlugin>('LiveRest')

// The Dynamic Island / Live Activity is iOS-only. Everywhere else these are
// no-ops so the web app and Android shell behave exactly as before.
const supported = Capacitor.getPlatform() === 'ios'

export const liveRest = {
  /** Start (first call) or update the rest Live Activity. */
  update(state: LiveRestState): void {
    if (!supported) return
    Native.update(state).catch(() => {
      /* unsupported OS version, permission off, or plugin missing — ignore */
    })
  },
  /** Tear the Live Activity down (workout finished or abandoned). */
  end(): void {
    if (!supported) return
    Native.end().catch(() => {})
  }
}
