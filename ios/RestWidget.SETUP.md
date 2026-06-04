# Rest-timer Live Activity (Dynamic Island) — Xcode setup

This adds a Dynamic Island / Lock Screen Live Activity that shows the
between-sets rest timer, colour-coded by phase:

- 🟣 **Rest** (violet) — counting down between sets
- 🟠 **Get ready** (amber) — final ~10 s of rest *(see "Behaviour" below)*
- 🟢 **Go** (green) — rest is over / a set is in progress

The web/React side and the Capacitor bridge are already wired. The only thing
that can't be scripted headlessly is **creating the Widget Extension target** —
that's a ~30-second wizard in Xcode. Steps:

## 1. Create the Widget Extension target
1. Open `ios/App/App.xcworkspace` in Xcode.
2. **File → New → Target… → Widget Extension.**
3. Product Name: **`RestWidget`**. ✅ tick **"Include Live Activity"**.
   (Untick "Include Configuration App Intent".) Finish → **Activate** the scheme.
4. Select the **RestWidget** target → **General → Minimum Deployments → iOS 16.2**.

## 2. Drop in the provided Swift files
Xcode generates sample files in the new `RestWidget` group. Replace them:
- **Delete** the generated `RestWidget.swift`, `RestWidgetBundle.swift`,
  `RestWidgetLiveActivity.swift`, and the sample `Assets`/`Info` only if duplicated.
- **Add** these files (already in the repo) to the **RestWidget** target
  (drag into the group, or right-click → Add Files…):
  - `ios/App/RestWidget/GymRestLiveActivity.swift`
  - `ios/App/RestWidget/RestWidgetBundle.swift`

## 3. Share the model with both targets
- Add `ios/App/App/GymRestAttributes.swift` to **both** targets:
  select it → **File Inspector → Target Membership** → tick **App** *and*
  **RestWidget**.
- Confirm `ios/App/App/LiveRestPlugin.swift` is in the **App** target only.

## 4. Enable Live Activities
Already done in code: `NSSupportsLiveActivities = YES` is set in
`ios/App/App/Info.plist`. (If you use a separate Info for the widget, no change
needed there.)

## 5. Build & run
```bash
npm run ios:sync      # vite build + cap sync ios (ships the JS bridge)
```
Then build/run from Xcode on:
- **iPhone 14 Pro or newer (or that simulator), iOS 16.2+** to see the actual
  Dynamic Island pill, **or**
- any iPhone on iOS 16.2+ to see it on the Lock Screen.

Start a workout and complete a set → the rest timer appears in the island.

## Behaviour (and one honest limitation)
This app has no backend by design, and iOS will not let an app update a Live
Activity on a **locked** phone without a push server. So:

- The **violet countdown** ticks live in the island even when locked (it's a
  system timer view, not app-driven). ✅
- The flip to **green "Go"** at rest-end is reliable locked *or* unlocked — it
  uses ActivityKit's `staleDate`, no server required. ✅
- The **amber "Get ready"** cue (last ~10 s) is pushed by the app, so it only
  appears when the app/phone is **awake/foreground** during those seconds. On a
  locked phone you'll see violet → green. To make amber reliable while locked
  you'd need APNs push updates (a small server) — happy to add that later.

## Where the wiring lives
- Native: `ios/App/App/LiveRestPlugin.swift`, `ios/App/App/GymRestAttributes.swift`,
  `ios/App/RestWidget/*.swift`
- JS bridge: `src/native/liveRest.ts`
- Driven from the active session in `src/App.tsx` (the `liveRest.update/end` effect)
