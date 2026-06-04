import WidgetKit
import SwiftUI

// Entry point for the RestWidget extension. If Xcode generated a sample
// "RestWidget.swift" / its own "*Bundle.swift" when you created the target,
// delete those — this bundle (the rest Live Activity) replaces them.
@main
struct RestWidgetBundle: WidgetBundle {
    var body: some Widget {
        GymRestLiveActivity()
    }
}
