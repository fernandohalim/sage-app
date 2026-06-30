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
| 2 | Design tokens + shell | Tailwind theme, fonts, dark mode, mobile nav. Static. | no | ✅ |
| 3 | Recipe entry + library | Structured entry, list, detail, edit/delete — local persistence behind an interface. | no | ✅ |
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

### Phase 2 — done (2026-06-30)
Design system + mobile app shell. **`tsc` clean, lint clean, `next build` green,
50 engine tests still pass.** No Firebase, no real data — static shell.

- `app/globals.css` — Tailwind v4 theme. Accent palette in `@theme`
  (terracotta/saffron/rust/olive, constant across modes). State-driven semantic
  tokens (`canvas`/`surface`/`ink`/`muted`/`line`) swap light↔dark via CSS vars
  → utilities `bg-canvas`, `text-ink`, `border-line`, etc. `tabular-nums` on by
  default in `body` + `num` utility. Base values: paper/ink (light),
  charcoal/cream (dark).
- `app/layout.tsx` — Fraunces (display) + Inter (UI) via `next/font`. Real
  metadata + viewport (theme-color, safe-area). No-FOUC inline script reads
  `localStorage["sage-theme"]` before paint. Wraps `AppShell`.
- `components/AppShell.tsx` — sticky header (Sage brand + theme toggle), centered
  `max-w-2xl` main, bottom nav.
- `components/BottomNav.tsx` — mobile nav (Library `/` · Add `/add` · Settings
  `/settings`), active state via `usePathname`. Target routes land in Phase 3+.
- `components/ThemeToggle.tsx` — light/dark toggle. `useSyncExternalStore` over
  DOM class + `matchMedia` (lint-clean, no hydration mismatch).
- `app/page.tsx` — static showcase home: one illustrative 4× recipe card
  exercising every token (saffron "dampened" flag, rust ceiling banner, olive
  taste-and-adjust advisory). Phase 3 replaces this with the real library.

**Notes / decisions:**
- Dark mode strategy: `.dark`/`.light` class on `<html>` overrides, else system
  via `prefers-color-scheme`. Custom variant `@custom-variant dark`.
- **Gotcha fixed:** semantic token names must not collide with `@theme` token
  names — `--ink: var(--color-ink)` created a circular ref. Accent names are
  `@theme`; semantic names are plain `:root` vars mapped via `@theme inline`.
- Removed default CRA scaffold SVGs from `public/`. Added `.claude/launch.json`
  (`sage-dev`, port 3000) for preview.
- Env note: local `node` was broken (Homebrew `libllhttp.9.3` missing);
  symlinked to `9.4.2` to unblock. Not a project change.

### Phase 3 — done (2026-06-30)
Recipe entry, library, detail, edit, delete — all on local persistence behind a
swappable interface. **`tsc` clean, lint clean, `next build` green, 50 engine
tests still pass.** Verified end-to-end in the browser (create → persist →
reload → delete, edit pre-fill incl. step→ingredient refs round-trip).

Persistence (the Phase 7 seam):
- `lib/store/repository.ts` — `RecipeRepository` interface (async) + `RecipeInput`
  (`Omit<Recipe,"id"|"createdAt">`). **Every caller talks to this, never storage.**
- `lib/store/localRepository.ts` — localStorage impl. Keys `sage:recipes` +
  `sage:seeded`. SSR-safe (guards `window`).
- `lib/store/seed.ts` — two first-run sample recipes (Tomato Soup, Sandwich
  Bread) spanning every scaling class. Seeded once; an emptied library stays empty.
- `lib/store/index.ts` — exports the singleton `recipeRepository`. **Phase 7
  swaps this one line (local → Firestore); nothing else moves.**

UI:
- `components/RecipesProvider.tsx` — client context + `useRecipes()`. Loads once,
  exposes reactive `recipes`/`loading`/`getRecipe`/`create`/`update`/`remove`.
  Wired into `AppShell` around the page content.
- `components/RecipeForm.tsx` — structured create/edit. Dynamic ingredient + step
  rows. **Auto-classifies ingredients by name via `classifyOrDefault`; manual
  class override sticks (per-row `classTouched`).** Steps carry optional timer
  (minutes) + toggleable ingredient-ref chips. Removing an ingredient prunes its
  refs. Draft amounts/timers held as strings, parsed on submit.
- `lib/format.ts` — `formatAmount`/`formatQuantity`/`formatTimer` + scaling-class
  labels/hints/order (shared by form + detail).
- Routes: `/` library list (replaced the Phase 2 showcase), `/add`,
  `/recipe/[id]` detail + delete (two-step confirm), `/recipe/[id]/edit`,
  `/settings` (about + "reset to sample recipes", kills the dead nav link).

**Decisions / notes:**
- Repository is **async** even though localStorage is sync — keeps the Firestore
  swap a no-op for callers.
- IDs via `crypto.randomUUID()` (recipe + ingredient + step). Ingredient ids are
  generated as rows are added so step refs bind immediately in the editor.
- Scaling UI is **not** here — detail shows base amounts only. The slider, anchor,
  advisories surface in Phase 4 (engine already supports them).
- `fixed`-class display nuance from Phase 1 is still deferred until Phase 4 UI.

---

## Out of v1 (do not build yet)
volume↔weight density conversion · multi-dish timing orchestrator · nutrition ·
"smart nudges."

## Honesty rule
Scaling outputs are **heuristics, not exact science.** The UI always defers to
"taste and adjust," never claims precision, never alarms.
