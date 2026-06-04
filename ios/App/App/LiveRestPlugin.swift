import Foundation
import Capacitor
#if canImport(ActivityKit)
import ActivityKit
#endif

/// Capacitor bridge that drives the rest-timer Live Activity (Dynamic Island)
/// from the web layer. Belongs to the "App" target only.
///
/// JS API (see src/native/liveRest.ts):
///   LiveRest.update({ phase, endsAt?, setIndex, setTotal, exerciseName, dayLabel })
///   LiveRest.end()
///
/// `update` starts the activity on first call and updates it thereafter, so the
/// JS side only ever has to describe the current state. Requires iOS 16.2+
/// (for ActivityContent / staleDate); on older systems every call is a no-op.
@objc(LiveRestPlugin)
public class LiveRestPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "LiveRestPlugin"
    public let jsName = "LiveRest"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "update", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "end", returnType: CAPPluginReturnPromise)
    ]

    // Stored untyped so the property itself needn't be availability-gated.
    private var _current: Any?

    @available(iOS 16.1, *)
    private var currentActivity: Activity<GymRestAttributes>? {
        get { _current as? Activity<GymRestAttributes> }
        set { _current = newValue }
    }

    @objc func update(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else {
            call.resolve(["ok": false, "reason": "requires iOS 16.2+"]); return
        }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else {
            call.resolve(["ok": false, "reason": "live activities disabled"]); return
        }

        var startedAt: Date?
        if let ms = call.getDouble("startedAt") { startedAt = Date(timeIntervalSince1970: ms / 1000.0) }
        var endsAt: Date?
        if let ms = call.getDouble("endsAt") { endsAt = Date(timeIntervalSince1970: ms / 1000.0) }
        let state = GymRestAttributes.ContentState(
            phase: call.getString("phase") ?? "lifting",
            startedAt: startedAt,
            endsAt: endsAt,
            setIndex: call.getInt("setIndex") ?? 1,
            setTotal: call.getInt("setTotal") ?? 1,
            exerciseName: call.getString("exerciseName") ?? ""
        )
        let dayLabel = call.getString("dayLabel") ?? ""
        // Mark the content stale exactly when rest ends so the widget can flip to
        // the green "Go" colour even while the app is suspended — no push needed.
        let staleDate: Date? = (state.phase == "resting" || state.phase == "almostUp") ? endsAt : nil
        let content = ActivityContent(state: state, staleDate: staleDate)

        Task {
            // Reconnect to an activity left running by a previous launch so a
            // relaunch mid-workout updates it instead of stacking a duplicate.
            if self.currentActivity == nil {
                self.currentActivity = Activity<GymRestAttributes>.activities.first
            }
            do {
                if let activity = self.currentActivity {
                    await activity.update(content)
                } else {
                    let attrs = GymRestAttributes(dayLabel: dayLabel)
                    self.currentActivity = try Activity.request(
                        attributes: attrs, content: content, pushType: nil
                    )
                }
                call.resolve(["ok": true])
            } catch {
                call.resolve(["ok": false, "reason": String(describing: error)])
            }
        }
    }

    @objc func end(_ call: CAPPluginCall) {
        guard #available(iOS 16.2, *) else { call.resolve(); return }
        Task {
            // Sweep every activity of this type (covers orphans from old launches).
            for activity in Activity<GymRestAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
            self.currentActivity = nil
            call.resolve()
        }
    }
}
