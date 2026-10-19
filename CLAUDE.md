# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Gyminder** — a single-user gym coach. It's a React + TypeScript PWA (Vite) wrapped as a native iOS app via Capacitor. There is **no backend, no account, no network dependency, and no AI at runtime**: all coaching is a deterministic rules engine over a curated exercise dataset, and all state lives in `localStorage`. This is a deliberate product choice, not a stopgap — preserve it. Likewise the UI is intentionally ultra-minimal and iPhone-first (aim for ≤2 taps to the primary action on any screen); don't add chrome, settings, or options without cause.

## Commands

```bash
npm run dev          # Vite dev server on http://localhost:5173
npm run build        # Production build → dist/ (also the Capacitor webDir)
npm run typecheck    # tsc --noEmit — the type gate; run this after any change
npm run preview      # Serve the built dist/
npm run gen-icons    # Regenerate PWA/app icons from public/favicon.svg (sharp)

npm run ios:sync     # vite build + cap sync ios  (ship JS changes into the iOS app)
npm run ios:open     # vite build + cap copy ios + open Xcode
```

### Tests

There is no test framework. The engine is pure functions over plain data, so it's tested by **standalone simulation scripts** that import the `.ts` source directly and assert against the stated rules. Run the whole script (there's no per-test filter):

```bash
npx tsx scripts/exhaustive-test.mjs   # every profile × split × equipment × progression path, swaps, alternatives, prescriptions, recovery, custom days, weekly volume (~9000 assertions)
npx tsx scripts/audit-numbers.mjs     # numeric values + event-sequence ordering through the real reducer (~550 assertions)
npx tsx scripts/trace-schedule.mjs    # debug trace for the day-scheduler (no assertions)
```

Use `npx tsx` — `tsx` is **not** in `node_modules`, and plain `node` / `node --experimental-strip-types` both fail because the scripts use extensionless `.ts` imports that only tsx resolves. After changing anything in `src/engine/` or `src/data/`, run both assertion scripts plus `npm run typecheck`.

`scripts/seed-sim.mjs <scenario>` seeds `localStorage` in a running iOS simulator for manual QA (hardcoded device UDID + bundle id inside).

## Architecture

### The core loop (the engine is the product)

Everything flows through `src/engine/` and `src/data/`, keyed everywhere by **exercise id** (string). One session of the app is:

1. **`recommendDay`** (`engine/schedule.ts`) picks which split day to train next. It is *not* a blind rotation — it scores every day in the active split against **volume-based recovery** derived from the full workout history: each session's **fractional sets** per muscle (primary mover 1 per set, `also` synergists ½ — `setsOn`) map to 24h (≤4) / 48h / 72h (≥10) via `recoveryHours`. A day is gated only by the muscles it trains substantially (a compound's target, or ≥4 direct sets), it enforces a 20h minimum gap, and tiebreaks toward days not yet done this cycle, then the day whose muscles were least recently trained *directly*. Read the long comments here before touching it; the round-robin/fresh-day logic exists to fix specific real splits (PPL6), and the tests assert that realistic weeks of every recommended split run in template order.
2. **`buildPlan`** (`engine/progression.ts`) turns the chosen `SplitDay` (a list of template ids) into a concrete `PlanItem[]`: it resolves each id through **`resolveForEquipment`** (`engine/equipment.ts`, a BFS over each exercise's `substitutions` chain to find something doable with the user's equipment), applies the user's **remembered swaps** (`state.swaps`, followed by `followSwaps`), applies **skip-swaps** (after 2 skips an exercise is replaced by an alternative), never repeats a *movement* in a session (`variantOf` links e.g. a table row to an inverted row) — a duplicate or unresolvable slot takes the next **strict** alternative or is dropped — and attaches coaching notes (`from` records what a swap replaced).
3. The user works through the `ActiveSession` set-by-set; **`mark`** records each `SessionEntry` (including the sets performed). **Swap** opens `SwapSheet`: ranked **`alternativesFor`** (`engine/alternatives.ts` — curated chain first, then same muscle + pattern/type; never anything already in the session), "Just today" or "Every time" (`swapExercise` → `rememberSwap`, keyed by the slot's original, cycle-free). Settings lists remembered swaps with Undo.
4. On finalize, **`applyResult`** advances each exercise's `ExerciseProgress` via **double progression** (climb the rep range at fixed load, then add weight and reset to the bottom of the range; unloaded moves hold at the top instead), and the session is appended to `history`. That history is what `recommendDay` reads next time — closing the loop.

Targets come from **`prescribe(ex, profile)`**: the dataset's ranges are the "Build muscle" defaults; "Get stronger" / "General fitness" and beginners (≤3 sets) are derived there, and every caller (session, Home, Live Activity, finalize) goes through it via `targetParts` / `restSeconds(ex, profile)`. The numeric constants in `progression.ts`, `schedule.ts` and the dataset (rep ranges, rest seconds, recovery bands, weight steps on the 2.5 kg / 5 lb wheel grid) encode the research mapped in **`docs/EVIDENCE.md`** — update both together. Treat them as load-bearing; the audit scripts assert them.

The active split is either one of the **built-in** programs (`data/splits.ts`; `recommendSplitId` proposes one from the profile) or a **user-authored custom split**: `ScheduleBuilder` lets the user pick a per-day `Focus` (`data/customSplit.ts`), `buildCustomSplit` materializes that into a `Split` of real exercise ids, and it's stored on `state.customSplit` and selected by `currentSplitId === CUSTOM_SPLIT_ID`. `recommendDay`'s pick is a *default*, not a lock — `WorkoutPicker` lets the user train any day of the active split instead.

Equipment is a four-tier ladder (`types.ts`): `full` ⊃ `dumbbell` ⊃ `bodyweight` (body + a pull-up bar / dip bars / rings — the original meaning, so saved profiles resolve unchanged) ⊃ `none` (nothing but furniture). Gaps within a tier (a dumbbell user without a bar) are handled by the per-exercise Swap, not more tiers. `recommendSplitId` only recommends splits that train every muscle ≥2×/week, caps beginners at 4 days, and avoids pull days for `none`.

Adding an exercise touches these in lockstep: `data/exercises.ts` (the record: primary + `also` synergists, `kit` label, rep range, optional `strength` range, `substitutions` ordered closest-first so every lower tier lands on a sensible lift, optional `variantOf`), `data/coaching.ts` (its `Pattern`, info, and a `technique` override wherever the shared pattern text would be wrong), optionally `data/demoMedia.ts` (only photos that show the actual movement — a wrong photo is worse than the rig), and `components/ExerciseAnimation.tsx` (`EXERCISE_ANIM` scene/load; a new `Pattern` also needs a `SPECS` pose). The how-to demo is **not** per-exercise art: it's one reusable side-view skeletal SVG rig that CSS-animates between the two poses (A↔B) its `Pattern` supplies — fully offline, respects `prefers-reduced-motion`, with only `scene`/`load` differentiated per exercise. The figure faces right and rotations are clockwise-positive (a limb at −80° points forward); verify new poses visually.

### State

A single `useReducer` store in `src/state/store.tsx` holds the entire `AppState` (`src/types.ts`) and is the **only** writer of state (`reducer`/`EMPTY` are exported only so the test scripts drive the real reducer). It persists to `localStorage` under key `gymapp.v1` on every change, and loads with a `{ ...EMPTY, ...saved }` merge so older saved states stay forward-compatible — when you add an `AppState` field, give `EMPTY` a default and keep existing fields optional. The reducer also owns mid-workout transient state (`active.setIdx`, `active.restEndsAt`) so a workout survives navigating away or reloading the app.

The `Settings` screen owns the few user-facing knobs: `theme` (`'dark' | 'light'`, applied via `data-theme`) and `settings.custom` — a global set/rep override that, when on, replaces every exercise's programmed targets with `settings.sets` × `settings.reps`. The profile itself (experience/goal/equipment/`units`, the last `'kg' | 'lb'` and optional for pre-units saves) is set in Onboarding and re-edited via "redo setup," not toggled here. Keep new options off this screen unless they earn their place (see the minimalism constraint above).

### Navigation

There is **no router**. `src/App.tsx` is a hand-rolled view state machine: a `view` enum + a few flags select which screen renders, derived partly from store state (no profile → Onboarding; no split → ModeSelect; `active` session → Session). `NavStack` (also in `App.tsx`) wraps the active screen and plays iOS-style push/pop/fade transitions by snapshotting the outgoing screen's DOM and animating based on a `NAV_DEPTH` map. Screens are dumb: they take `onBack` / `onDone` / `onStart` callbacks and call store actions — they don't navigate themselves.

### iOS native bridge

The only native code is a **rest-timer Live Activity** (Dynamic Island). `src/native/liveRest.ts` is a Capacitor plugin shim that **no-ops on web/Android** (`Capacitor.getPlatform() !== 'ios'`), so the engine and UI never branch on platform. It's driven entirely from an effect in `App.tsx` that mirrors the active session. The Swift side lives in `ios/App/App/LiveRestPlugin.swift` + `GymRestAttributes.swift` and the widget in `ios/App/RestWidget/`. The Widget Extension target must be created once in Xcode — see `ios/RestWidget.SETUP.md`, which also documents the deliberate locked-phone limitation (no push server by design).

### Design system

`src/styles.css` is the single source of design truth — the **"Ink & Lime"** system (a 2026-06 heavy reinvention that replaced the earlier "Volt"/"Aura"): a **near-monochrome canvas** (ink on bone) charged by ONE **electric-lime** signal (`--accent`, `#c8ff3d`) used only on what's live, ready, or actionable. Structure comes from **hairlines and whitespace**, not boxes or glows; light+dark via `:root[data-theme]`. It is **token-driven** — colors, type scale, radii and shadows live on `:root`, so most restyling is done by editing tokens, not individual rules. **Light-theme caveat:** lime is illegible as text on bone, so there it appears only as fills/marks and accent *text* routes through `--accent-text` (a deep olive-lime) — preserve that fill-vs-text split when adding accent-coloured elements. Typography is **one family, bundled and self-hosted** (fully offline, no CDN) via Fontsource, imported in `src/main.tsx`: **Geist** carries every size (`--font-ui` = `--font-display`) — oversized tightly-tracked display titles, small uppercase tracked overlines (`.overline`), and tabular numerals so the rest timer / weights / reps never jitter; **Inter** is the fallback. `NavStack` plays a real iOS-style push/pop/fade stack whose durations are mirrored in `App.tsx` (keep the CSS `--nav-*` durations under the JS settle timers). Prefer existing tokens/classes over new ad-hoc styles.

## Workflow

Feature work happens on `feat/*` branches merged to `main` via PR (see git history). `main` is the working branch.
