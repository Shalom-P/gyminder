import ActivityKit
import WidgetKit
import SwiftUI

// Live-workout palette — kept in sync with the "Ink & Lime" system in
// src/styles.css. Lime (--accent #c8ff3d) is the app's signal for "live /
// actionable", so the go/lift phase wears it; rest and the get-ready warning
// keep distinct state colours so the countdown still reads at a glance.
private let restViolet = Color(red: 0.655, green: 0.545, blue: 0.980) // #a78bfa  rest
private let warnAmber  = Color(red: 1.000, green: 0.690, blue: 0.130) // #ffb020  get ready
private let goLime     = Color(red: 0.784, green: 1.000, blue: 0.239) // #c8ff3d  go / lift

private enum RestPhase {
    case resting, almostUp, go

    var color: Color {
        switch self {
        case .resting:  return restViolet
        case .almostUp: return warnAmber
        case .go:       return goLime
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

// Once stale (rest elapsed) we always show "Go", whatever the app last pushed.
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

// A colour-coded bar that drains continuously over the whole rest. Like the
// countdown text it is system-driven, so it keeps moving even on a locked phone.
@ViewBuilder
private func drainBar(_ context: ActivityViewContext<GymRestAttributes>, tint: Color) -> some View {
    if isCounting(context),
       let start = context.state.startedAt,
       let end = context.state.endsAt,
       start < end {
        ProgressView(timerInterval: start...end, countsDown: true) {
            EmptyView()
        } currentValueLabel: {
            EmptyView()
        }
        .progressViewStyle(.linear)
        .tint(tint)
    } else {
        Capsule().fill(tint).frame(height: 5).frame(maxWidth: .infinity)
    }
}

@ViewBuilder
private func bigTimer(_ context: ActivityViewContext<GymRestAttributes>, _ p: RestPhase, size: CGFloat) -> some View {
    if isCounting(context), let end = context.state.endsAt {
        Text(timerInterval: Date()...end, countsDown: true)
            .font(.system(size: size, weight: .bold, design: .rounded))
            .monospacedDigit()
            .foregroundStyle(p.color)
    } else {
        Text(p.word)
            .font(.system(size: size * 0.7, weight: .bold, design: .rounded))
            .foregroundStyle(p.color)
    }
}

// Shown in the go/lift phase in place of the (now finished) rest bar: a quiet
// cue that the Live Activity is tappable. Tapping it foregrounds the app on the
// Session screen, where the lifter logs the set they just did — no in-island
// button (and no App Intent target) needed.
@ViewBuilder
private func tapToLogCue(_ tint: Color) -> some View {
    Label("Tap to log set", systemImage: "hand.tap.fill")
        .font(.caption2.weight(.semibold))
        .foregroundStyle(tint)
        .frame(maxWidth: .infinity, alignment: .center)
}

struct GymRestLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: GymRestAttributes.self) { context in
            // Whole Lock Screen card tints to the current phase colour.
            RestLockScreenView(context: context)
                .activityBackgroundTint(phaseFor(context).color.opacity(0.16))
                .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            let p = phaseFor(context)
            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Label {
                        Text(p.word).font(.caption.weight(.bold))
                    } icon: {
                        Image(systemName: p.icon)
                    }
                    .foregroundStyle(p.color)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Set \(context.state.setIndex)/\(context.state.setTotal)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(p.color)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 8) {
                        HStack(alignment: .firstTextBaseline) {
                            Text(context.state.exerciseName)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.white)
                                .lineLimit(1)
                            Spacer(minLength: 8)
                            bigTimer(context, p, size: 26)
                        }
                        if isCounting(context) {
                            drainBar(context, tint: p.color)
                        } else {
                            tapToLogCue(p.color)
                        }
                    }
                }
            } compactLeading: {
                Image(systemName: p.icon).foregroundStyle(p.color)
            } compactTrailing: {
                if isCounting(context), let end = context.state.endsAt {
                    Text(timerInterval: Date()...end, countsDown: true)
                        .font(.caption2.weight(.bold))
                        .monospacedDigit()
                        .foregroundStyle(p.color)
                        .frame(maxWidth: 44)
                } else {
                    // Lifting / go: the colour + icon already say "go", so the
                    // trailing slot earns its keep showing which set you're on.
                    Text("\(context.state.setIndex)/\(context.state.setTotal)")
                        .font(.caption2.weight(.bold))
                        .monospacedDigit()
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
        VStack(spacing: 12) {
            HStack(spacing: 14) {
                ZStack {
                    Circle().fill(p.color.opacity(0.22)).frame(width: 50, height: 50)
                    Image(systemName: p.icon)
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(p.color)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(p.word.uppercased())
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(p.color)
                    Text(context.state.exerciseName)
                        .font(.headline)
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Text("Set \(context.state.setIndex) of \(context.state.setTotal)")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.65))
                }
                Spacer()
                bigTimer(context, p, size: 30)
                    .frame(minWidth: 86, alignment: .trailing)
            }
            if isCounting(context) {
                drainBar(context, tint: p.color)
            } else {
                tapToLogCue(p.color)
            }
        }
        .padding(16)
    }
}
