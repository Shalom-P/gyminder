import { SPLITS, recommendSplitId } from '../data/splits'
import { useStore } from '../state/store'
import { XIcon } from '../components/icons'

export default function ModeSelect({
  onBack,
  onPicked,
  onBuild
}: {
  onBack?: () => void
  onPicked: () => void
  onBuild: () => void
}) {
  const { state, setSplit } = useStore()
  const recoId = state.profile ? recommendSplitId(state.profile) : null

  function pick(id: string) {
    setSplit(id)
    onPicked()
  }

  return (
    <div className="frame push">
      <div className="top">
        {onBack ? (
          <button className="icon-btn" onClick={onBack} aria-label="Back">
            <XIcon />
          </button>
        ) : (
          <span />
        )}
        <span className="brand center">Training mode</span>
      </div>
      <div className="body scroll">
        <p className="muted">
          Pick how you want to train. You can change this anytime — your
          progress carries over.
        </p>
        <div className="list">
          <button className="choice reco" onClick={onBuild}>
            <span className="badge">Custom</span>
            <span className="title">Build your own schedule</span>
            <span className="muted">
              Choose your days and what each one trains
            </span>
          </button>
          {SPLITS.map((s) => (
            <button
              key={s.id}
              className={`choice${s.id === recoId ? ' reco' : ''}`}
              onClick={() => pick(s.id)}
            >
              {s.id === recoId && <span className="badge">Recommended</span>}
              <span className="title">{s.name}</span>
              <span className="muted">
                {s.daysPerWeek} days/week · {s.blurb}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
