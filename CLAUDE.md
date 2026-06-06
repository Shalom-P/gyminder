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
npx tsx scripts/exhaustive-test.mjs   # every profile × split × equipment × progression path (~1800 assertions)
npx tsx scripts/audit-numbers.mjs     # numeric values + event-sequence ordering (~285 assertions)
npx tsx scripts/trace-schedule.mjs    # debug trace for the day-scheduler (no assertions)
```

Use `npx tsx` — `tsx` is **not** in `node_modules`, and plain `node` / `node --experimental-strip-types` both fail because the scripts use extensionless `.ts` imports that only tsx resolves. After changing anything in `src/engine/` or `src/data/`, run both assertion scripts plus `npm run typecheck`.

`scripts/seed-sim.mjs <scenario>` seeds `localStorage` in a running iOS simulator for manual QA (hardcoded device UDID + bundle id inside).

## Architecture

### The core loop (the engine is the product)

Everything flows through `src/engine/` and `src/data/`, keyed everywhere by **exercise id** (string). One session of the app is:

1. **`recommendDay`** (`engine/schedule.ts`) picks which split day to train next. It is *not* a blind rotation — it scores every day in the active split against per-muscle **recovery windows** (e.g. chest 60h, biceps 36h) derived from the full workout history, enforces a 20h minimum gap, and tiebreaks toward days not yet done this cycle. Read the long comments here before touching it; the round-robin/fresh-day logic exists to fix specific real splits (PPL6).
2. **`buildPlan`** (`engine/progression.ts`) turns the chosen `SplitDay` (a list of template ids) into a concrete `PlanItem[]`: it resolves each id through **`resolveForEquipment`** (`engine/equipment.ts`, a BFS over each exercise's `substitutions` chain to find something doable with the user's equipment), applies **skip-swaps** (after 2 skips an exercise is replaced by an alternative), and attaches coaching notes.
3. The user works through the `ActiveSession` set-by-set; **`mark`** records each `SessionEntry`.
4. On finalize, **`applyResult`** advances each exercise's `ExerciseProgress` via **double progression** (climb the rep range at fixed load, then add weight and reset to the bottom of the range), and the session is appended to `history`. That history is what `recommendDay` reads next time — closing the loop.

The numeric constants in `progression.ts` and `schedule.ts` (rep ranges, rest seconds, recovery hours, weight steps) encode training-science consensus and are documented inline with rationale. Treat them as load-bearing; the audit script asserts them.

Adding an exercise touches three data files in lockstep: `data/exercises.ts` (the record + its `substitutions` fallback chain), `data/coaching.ts` (map it to a movement `Pattern` for technique content + the generated animation), and optionally `data/demoMedia.ts` (real demo photos).

### State

A single `useReducer` store in `src/state/store.tsx` holds the entire `AppState` (`src/types.ts`) and is the **only** writer of state. It persists to `localStorage` under key `gymapp.v1` on every change, and loads with a `{ ...EMPTY, ...saved }` merge so older saved states stay forward-compatible — when you add an `AppState` field, give `EMPTY` a default and keep existing fields optional. The reducer also owns mid-workout transient state (`active.setIdx`, `active.restEndsAt`) so a workout survives navigating away or reloading the app.

### Navigation

There is **no router**. `src/App.tsx` is a hand-rolled view state machine: a `view` enum + a few flags select which screen renders, derived partly from store state (no profile → Onboarding; no split → ModeSelect; `active` session → Session). `NavStack` (also in `App.tsx`) wraps the active screen and plays iOS-style push/pop/fade transitions by snapshotting the outgoing screen's DOM and animating based on a `NAV_DEPTH` map. Screens are dumb: they take `onBack` / `onDone` / `onStart` callbacks and call store actions — they don't navigate themselves.

### iOS native bridge

The only native code is a **rest-timer Live Activity** (Dynamic Island). `src/native/liveRest.ts` is a Capacitor plugin shim that **no-ops on web/Android** (`Capacitor.getPlatform() !== 'ios'`), so the engine and UI never branch on platform. It's driven entirely from an effect in `App.tsx` that mirrors the active session. The Swift side lives in `ios/App/App/LiveRestPlugin.swift` + `GymRestAttributes.swift` and the widget in `ios/App/RestWidget/`. The Widget Extension target must be created once in Xcode — see `ios/RestWidget.SETUP.md`, which also documents the deliberate locked-phone limitation (no push server by design).

### Design system

`src/styles.css` is the single source of design truth — the **"Ink & Lime"** system (a 2026-06 heavy reinvention that replaced the earlier "Volt"/"Aura"): a **near-monochrome canvas** (ink on bone) charged by ONE **electric-lime** signal (`--accent`, `#c8ff3d`) used only on what's live, ready, or actionable. Structure comes from **hairlines and whitespace**, not boxes or glows; light+dark via `:root[data-theme]`. It is **token-driven** — colors, type scale, radii and shadows live on `:root`, so most restyling is done by editing tokens, not individual rules. **Light-theme caveat:** lime is illegible as text on bone, so there it appears only as fills/marks and accent *text* routes through `--accent-text` (a deep olive-lime) — preserve that fill-vs-text split when adding accent-coloured elements. Typography is **one family, bundled and self-hosted** (fully offline, no CDN) via Fontsource, imported in `src/main.tsx`: **Geist** carries every size (`--font-ui` = `--font-display`) — oversized tightly-tracked display titles, small uppercase tracked overlines (`.overline`), and tabular numerals so the rest timer / weights / reps never jitter; **Inter** is the fallback. `NavStack` plays a real iOS-style push/pop/fade stack whose durations are mirrored in `App.tsx` (keep the CSS `--nav-*` durations under the JS settle timers). Prefer existing tokens/classes over new ad-hoc styles.

## Workflow

Feature work happens on `feat/*` branches merged to `main` via PR (see git history). `main` is the working branch.
