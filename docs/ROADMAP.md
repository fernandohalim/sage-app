# Sage — v1.0 Roadmap

> Living document. Updated at the end of each phase.
> Status legend: ⬜ not started · 🚧 in progress · ✅ done

## The promise
Scale a recipe correctly — respecting that salt, aromatics, leavening, and time
don't scale linearly — then tell the cook what to taste and check. Every feature
serves that one promise.

## Stack (locked for v1)
- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4
- Firebase Auth (Google) + Firestore (offline persistence) — **added in Phase 7**
- PWA: manifest + service worker + Screen Wake Lock
- Package manager: **npm** (lockfile committed)
- Test runner: **Vitest**
- Cadence: **plan → approve → build, one phase at a time**

## Architecture rules
- Scaling engine is **pure, framework-agnostic, fully unit-tested** — no React,
  no Firebase imports. UI and persistence call into it.
- Persistence sits behind a **clean interface** so Phase 3 (local) → Phase 7
  (Firestore) is a swap, not a rewrite.
- Mobile-first. Dark mode is first-class. Small, strongly typed modules.
- No IndexedDB hand-rolled on top of Firestore.

### Project structure (no `src/`)
- Routes in root `app/`. Non-route code in root `lib/` and `components/`.
- Path alias `@/*` → repo root, so imports read `@/lib/engine`, `@/components/...`.
- Scaling engine: `lib/engine/`. Tests live beside source as `*.test.ts`.

---

## Feature list (all of v1)

### A. Scaling engine (the soul — pure TS)
- `scaledAmount = baseAmount × factor^k`
- Classes + exponents: `linear` 1.0 · `seasoning` ~0.8 · `aromatic_strong` ~0.7 ·
  `leavening` ~0.95 (warn >2×) · `surface` ~flat · `discrete_aromatic` sub-linear+round ·
  `fixed` never
- Discrete rounding (bay leaf 1→2, never →3)
- Scale-down correctness (factor < 1)
- Advisories: pan size · non-linear time · seasoning checkpoint · scaling ceiling (~3–4×)
- Anchor/constraint scaling: derive factor from "I have X" of any ingredient
- Per-ingredient flag output (dampened? how much vs. linear?)

### B. Ingredient classification
- Seed dictionary (`name → scalingClass`), trivially extensible
- Auto-tag on entry by name match · manual override always

### C. Recipe data + entry
- Structured entry (title, baseServings, tags; ingredients amount/unit/name/class;
  steps with optional timer + ingredientRefs)
- Library list · detail view · edit · delete
- URL import via `schema.org/Recipe` JSON-LD, structured fallback

### D. Scaling UI (signature interaction)
- Yield slider → live numbers (tabular figures)
- Anchor-on-ingredient control
- Flagged ingredient = saffron · ceiling warning = rust
- Advisory surfacing (taste-and-adjust voice, never alarmist)

### E. Cook mode
- Enlarged high-contrast layout, big touch targets
- Inline scaled amounts inside each step
- Multiple concurrent tappable timers · Wake Lock

### F. Auth + sync (Firebase)
- Google sign-in · per-user Firestore (`users/{uid}/recipes`)
- Offline persistence · locked security rules · shared `ingredientDictionary` seed

### G. PWA / platform
- Manifest + installability · service worker · dark mode · mobile shell + nav

### H. Design system
- State-driven color tokens (paper/ink/charcoal/cream + terracotta/saffron/rust/olive)
- Fraunces (display) + Inter (UI) · tabular-nums on every quantity

---

## Phases

| # | Name | Delivers | Firebase | Status |
|---|---|---|---|---|
| 0 | Context & plan | This document | no | ✅ |
| 1 | Scaling engine | Pure TS module + seed dictionary, fully unit-tested. Recipe/Ingredient/Step types. | no | ✅ |
| 2 | Design tokens + shell | Tailwind theme, fonts, dark mode, mobile nav. Static. | no | ⬜ |
| 3 | Recipe entry + library | Structured entry, list, detail, edit/delete — local persistence behind an interface. | no | ⬜ |
| 4 | Scaling UI | Slider → live numbers, anchor scaling, flagged ingredients, advisories. | no | ⬜ |
| 5 | Cook mode | Inline scaled amounts, concurrent timers, Wake Lock. | no | ⬜ |
| 6 | URL import | JSON-LD parse + auto-classify + structured fallback. | no | ⬜ |
| 7 | Firebase auth + sync | Google sign-in; swap local persistence → Firestore (offline); rules; seed dictionary collection. | yes | ⬜ |
| 8 | PWA polish | Manifest, service worker, install, offline verification, final design pass. | yes | ⬜ |

**Key bet:** Phases 1–6 ship a fully working single-device app with **zero
Firebase**. Phase 7 swaps the storage layer underneath. This keeps the
soul-critical work unblocked by infra.

### Phase 1 — done (2026-06-30)
Engine at `lib/engine/`. Pure (no React/Firebase). **50 Vitest tests pass,
`tsc --noEmit` clean.** Run: `npm run test` (watch) / `npm run test:run`.

- `types.ts` — Recipe / Ingredient / Step / ScaleResult / Advisory
- `classes.ts` — per-class exponents (the tuning knobs)
- `round.ts` — discrete rounding (bay leaf 1→2, never to 0)
- `scale.ts` — `scaleAmount` / `scaleIngredient` (the formula)
- `advisories.ts` — pan-size · time · seasoning · leavening · ceiling
- `anchor.ts` — "I have X" → factor (inverse-exponent, anchor lands exact)
- `recipe.ts` — public entry: `scaleToServings` / `scaleByFactor` / `scaleByAnchor`
- `dictionary.ts` — seed name→class + `classifyByName` / `classifyOrDefault`
- `index.ts` — public surface

Chosen exponents (k): linear 1.0 · seasoning 0.8 · aromatic_strong 0.7 ·
leavening 0.95 (warnAbove 2) · **surface 0.25** · discrete_aromatic 0.7 (round) ·
fixed n/a. `SCALING_CEILING = 3.5`.

**Open tweaks deferred (not blocking):**
- `surface` k=0.25 is a judgement call (flat vs √-area). Revisit with real use.
- `discrete_aromatic` k=0.7 → 1→2 at 2×, 1→3 at 4×. Lower to keep singles at 1 longer.
- `fixed` ingredients report `wasAdjusted: true` (diverge from naive) — UI shows
  "kept unchanged". Flip if a fresh decision wants `fixed` to read as not-adjusted.

---

## Out of v1 (do not build yet)
volume↔weight density conversion · multi-dish timing orchestrator · nutrition ·
"smart nudges."

## Honesty rule
Scaling outputs are **heuristics, not exact science.** The UI always defers to
"taste and adjust," never claims precision, never alarms.
