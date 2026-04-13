# AGENTS.md

This file applies to the greenfield app in `/Users/oberon/Projects/coding/javascript/gwinnett-dope-wars/modern`.

## Purpose

This is the modern rebuild of the Gwinnett County Dope Wars project.

- Treat the legacy app in the repo root as reference material only.
- Do not wire the new app directly to legacy runtime files.
- Port ideas and content from the legacy project into typed modules in this app.

## Core Principles

1. Keep gameplay logic separate from presentation.
2. Keep the visual direction intentional, cinematic, and specific to Gwinnett County.
3. Prefer extending typed domain modules over embedding ad hoc strings or magic values in React components.
4. Avoid reintroducing jQuery-style DOM coupling or legacy script-tag patterns.

## Architecture

### Game domain

- `src/game/types.ts`
  Shared domain types. Update this first when adding new structured data.
- `src/game/content.ts`
  Canonical city, drug, and score content.
- `src/game/core.ts`
  Gameplay rules and state transitions. This layer should stay free of React, DOM access, and styling concerns.

### UI

- `src/App.tsx`
  High-level screen composition and local app state orchestration.
- `src/components/MapScene.tsx`
  Bespoke SVG territory scene. Keep map rendering and map interaction details here instead of bloating `App.tsx`.
- `src/App.css`
  Shell, cards, hero, stats, news, and market board styling.
- `src/components/MapScene.css`
  Map-specific presentation and animation.
- `src/index.css`
  Global tokens, base typography, and page background.

### Creative direction

- `docs/art-direction.md`
  The source of truth for visual tone, motion goals, and future asset direction.

## Rules For Future Agents

### When changing gameplay

- Make rule changes in `src/game/core.ts`.
- If the change adds a new concept, update `src/game/types.ts`.
- If the change adds or edits canonical drugs, cities, labels, or score tiers, update `src/game/content.ts`.
- Do not hide game rules inside React components.

### When changing the map

- Prefer editing `src/components/MapScene.tsx` and `src/components/MapScene.css`.
- Keep route geometry, district overlays, and node interactions inside the map component.
- If moving from SVG to Canvas or Pixi later, preserve the current component boundary so the rest of the app does not need to change much.

### When changing styling

- Preserve the current visual lane: warm noir, surveillance-board, suburban Georgia after dark.
- Avoid generic SaaS styling, default purple gradients, or flattened dashboard aesthetics.
- Use existing CSS variables and visual motifs before introducing unrelated styles.

### When changing content

- Preserve stable `CityId` and `DrugId` values unless a deliberate migration is required.
- If IDs change, update all dependent state and lookup logic in the same change.
- Keep locations grounded in real Gwinnett County places.

## Guardrails

- Do not import runtime code from `../assets/js/*.js`.
- Do not rebuild the app around direct DOM manipulation.
- Do not hand-edit generated output in `dist/`.
- Do not make meaningful source changes inside `node_modules/`.
- Avoid adding dependencies unless they clearly support the modern rebuild.

## Dev Workflow

Run from `/Users/oberon/Projects/coding/javascript/gwinnett-dope-wars/modern`:

```bash
npm run dev
npm run lint
npm run build
```

Before finishing meaningful source changes:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Report any limitations or skipped verification clearly.

## Current State

- The app already has a pure typed game core.
- The market loop supports travel, market generation, buying, selling, and run-value tracking.
- The territory board is now a dedicated SVG scene component.
- Text is still hard-coded in the new app and has not yet been moved to a modern i18n layer.
- Save/load, cops, random encounters, weapons, bank depth, and endgame polish are still pending.

## Good Next Steps

1. Add modern i18n support.
2. Add persistent saves and high scores.
3. Expand `src/game/core.ts` with cops, encounters, and financial systems.
4. Replace placeholder geometric map art with custom illustrated assets while keeping the same component boundary.

## Legacy References

Useful source material only:

- `../assets/js/data.js`
- `../assets/js/models.js`
- `../locales/dopewars.en-US.properties`

Port from them. Do not depend on them at runtime.
