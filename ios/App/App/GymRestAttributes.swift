import Foundation
#if canImport(ActivityKit)
import ActivityKit

/// The Live Activity model, shared by the App target (which starts / updates /
/// ends the activity) and the RestWidget extension (which renders it in the
/// Dynamic Island and on the Lock Screen).
///
/// IMPORTANT (Xcode): this single file must belong to BOTH targets — select it
/// in the Project navigator and tick both "App" and "RestWidget" under
/// File Inspector → Target Membership. See ios/RestWidget.SETUP.md.
@available(iOS 16.1, *)
struct GymRestAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        /// "resting" | "almostUp" | "lifting"
        var phase: String
        /// Wall-clock moment the current rest ends; nil while a set is active.
        var endsAt: Date?
        /// 1-based index of the upcoming/active set.
        var setIndex: Int
        var setTotal: Int
        var exerciseName: String
    }

    /// e.g. "Full Body A" — fixed for the life of the activity.
    var dayLabel: String
}
#endif
