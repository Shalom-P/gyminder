import ActivityKit
import WidgetKit
import SwiftUI

// Aura palette — kept in sync with src/styles.css.
private let restViolet = Color(red: 0.655, green: 0.545, blue: 0.980) // #a78bfa  rest
private let warnAmber  = Color(red: 1.000, green: 0.690, blue: 0.130) // #ffb020  get ready
private let goGreen    = Color(red: 0.200, green: 0.780, blue: 0.349) // #34c759  go / lift

private enum RestPhase {
    case resting, almostUp, go

    var color: Color {
        switch self {
        case .resting:  return restViolet
        case .almostUp: return warnAmber
        case .go:       return goGreen
        }
    }
    var icon: String {
        switch self {
        case .resting:  return "hourglass"
        case .almostUp: return "hourglass.bottomhalf.filled"
        case .go:       return "figure.strengthtraining.traditional"
        }
    }
    var word: String {
        switch self {
        case .resting:  return "Rest"
        case .almostUp: return "Get ready"
        case .go:       return "Go"
        }
    }
}

// Once the content is stale (rest has elapsed) we always show "Go", regardless
// of the last phase the app managed to push.
private func phaseFor(_ context: ActivityViewContext<GymRestAttributes>) -> RestPhase {
    if context.isStale { return .go }
    switch context.state.phase {
    case "resting":  return .resting
    case "almostUp": return .almostUp
    default:         return .go
    }
}

private func isCounting(_ context: ActivityViewContext<GymRestAttributes>) -> Bool {
    guard let endsAt = context.state.endsAt, !context.isStale else { return false }
    return endsAt > Date()
}

struct GymRestLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: GymRestAttributes.self) { context in
            RestLockScreenView(context: context)
                .padding(16)
                .activityBackgroundTint(Color.black.opacity(0.9))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            let p = phaseFor(context)
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 6) {
                        Image(systemName: p.icon)
                        Text(p.word).font(.caption.weight(.semibold))
                    }
                    .foregroundStyle(p.color)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Set \(context.state.setIndex) of \(context.state.setTotal)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(context.state.exerciseName)
                        .font(.subheadline.weight(.semibold))
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if isCounting(context), let endsAt = context.state.endsAt {
                        Text(timerInterval: Date()...endsAt, countsDown: true)
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .multilineTextAlignment(.center)
                            .foregroundStyle(p.color)
                            .frame(maxWidth: .infinity)
                    } else {
                        Text(p == .go ? "Time to lift" : p.word)
                            .font(.headline)
                            .foregroundStyle(p.color)
                            .frame(maxWidth: .infinity)
                    }
                }
            } compactLeading: {
                Image(systemName: p.icon).foregroundStyle(p.color)
            } compactTrailing: {
                if isCounting(context), let endsAt = context.state.endsAt {
                    Text(timerInterval: Date()...endsAt, countsDown: true)
                        .monospacedDigit()
                        .foregroundStyle(p.color)
                        .frame(maxWidth: 44)
                } else {
                    Text("\(context.state.setIndex)/\(context.state.setTotal)")
                        .foregroundStyle(p.color)
                }
            } minimal: {
                Image(systemName: p.icon).foregroundStyle(p.color)
            }
            .keylineTint(p.color)
        }
    }
}

struct RestLockScreenView: View {
    let context: ActivityViewContext<GymRestAttributes>

    var body: some View {
        let p = phaseFor(context)
        HStack(spacing: 14) {
            ZStack {
                Circle().fill(p.color.opacity(0.18)).frame(width: 52, height: 52)
                Image(systemName: p.icon).font(.title3).foregroundStyle(p.color)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(context.attributes.dayLabel.uppercased())
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(p.color)
                Text(context.state.exerciseName)
                    .font(.headline)
                    .foregroundStyle(.white)
                    .lineLimit(1)
                Text("Set \(context.state.setIndex) of \(context.state.setTotal)")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.7))
            }
            Spacer()
            if isCounting(context), let endsAt = context.state.endsAt {
                Text(timerInterval: Date()...endsAt, countsDown: true)
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(p.color)
                    .frame(width: 88)
            } else {
                Text(p.word)
                    .font(.headline.weight(.bold))
                    .foregroundStyle(p.color)
            }
        }
    }
}
