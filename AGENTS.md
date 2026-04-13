# AGENTS.md

This file applies to the greenfield app in `/Users/oberon/Projects/coding/javascript/local-dope-wars/`.

## Purpose

This is the modern rebuild of the classic Dope Wars project, now branded as Local Dope Wars.

- The current built-in setting should continue to default to the existing Gwinnett County content unless deliberately changed.
- The long-term goal is to make locations and related content customizable without baking one county's data into the architecture.
- Treat the legacy app in the sibling folder `../gwinnett-dope-wars/` as reference material only.
- Do not wire the new app directly to legacy runtime files.
- Port ideas and content from the legacy project into typed modules in this app.

## Core Principles

1. Keep gameplay logic separate from presentation.
2. Keep the visual direction intentional, cinematic, and grounded in the default Gwinnett County setting while allowing future location packs to swap in their own content and presentation.
3. Prefer extending typed domain modules over embedding ad hoc strings or magic values in React components.
4. Avoid reintroducing jQuery-style DOM coupling or legacy script-tag patterns.
5. Prefer data-driven content and configuration hooks over hard-coding the current default locations into React components.

## Architecture

### Game domain

- `src/game/types.ts`
  Shared domain types. Update this first when adding new structured data.
- `src/game/content.ts`
  Canonical default city, drug, and score content. Keep future customizable content aligned to the same typed shape.
- `src/game/core.ts`
  Gameplay rules and state transitions. This layer should stay free of React, DOM access, and styling concerns.
- `src/game/i18n.ts`
  Typed locale/copy definitions and formatting helpers. Move shared player-facing UI/system copy here instead of scattering literals across components and core logic.

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
- If the change adds or edits default drugs, cities, labels, score tiers, or other bundled content, update `src/game/content.ts`.
- If the change introduces customizable location/content support, add it through typed game/domain modules instead of hiding it in React state or component markup.
- Do not hide game rules inside React components.

### When changing the map

- Prefer editing `src/components/MapScene.tsx` and `src/components/MapScene.css`.
- Keep route geometry, district overlays, and node interactions inside the map component.
- If moving from SVG to Canvas or Pixi later, preserve the current component boundary so the rest of the app does not need to change much.
- Keep map rendering flexible enough that the current Gwinnett scene can remain the default while future location sets can swap in their own geography.

### When changing styling

- Preserve the current visual lane: warm noir, surveillance-board, suburban Georgia after dark.
- Avoid generic SaaS styling, default purple gradients, or flattened dashboard aesthetics.
- Use existing CSS variables and visual motifs before introducing unrelated styles.
- When adding customizable themes or location packs, keep the default Gwinnett presentation strong instead of flattening everything into a generic neutral shell.

### When changing content

- Preserve stable built-in `CityId` and `DrugId` values unless a deliberate migration is required.
- If IDs change, update all dependent state and lookup logic in the same change.
- Keep the default bundled locations grounded in real Gwinnett County places.
- New customization work should make alternate locations possible without weakening the typed default content path.

## Guardrails

- Do not import runtime code from `../gwinnett-dope-wars/assets/js/*.js`.
- Do not rebuild the app around direct DOM manipulation.
- Do not hand-edit generated output in `dist/`.
- Do not make meaningful source changes inside `node_modules/`.
- Avoid adding dependencies unless they clearly support the modern rebuild.

## Dev Workflow

Run from `/Users/oberon/Projects/coding/javascript/local-dope-wars`:

```bash
npm run dev
npm run lint
npm run build
```

Before finishing meaningful source changes:

1. Run `npm run lint`.
2. Run `npm run build`.
3. Report any limitations or skipped verification clearly.

When asked to create a commit:

1. Use Conventional Commits for the subject line, for example `feat: add run persistence`.
2. Include a short commit body that states what changed.
3. Include a short validation note in the commit body, such as `Validation: npm run lint && npm run build`.

## Current State

- The app already has a pure typed game core.
- The market loop supports travel, market generation, buying, selling, and run-value tracking.
- The territory board is now a dedicated SVG scene component.
- The current built-in content still defaults to the Gwinnett County location set.
- A typed content-pack foundation now exists, but there is not yet a player-facing pack picker or alternate bundled location set.
- A typed English locale/copy layer now exists in `src/game/i18n.ts`, but broader locale coverage and fuller copy extraction are still in progress.
- Save/load, cops, random encounters, weapons, bank depth, and endgame polish are still pending.

## Good Next Steps

1. Expand the locale layer to cover the remaining player-facing copy and support additional locales.
2. Add a player-facing way to choose or swap content packs while keeping Gwinnett as the built-in default.
3. Expand `src/game/core.ts` with cops, encounters, and financial systems.
4. Replace placeholder geometric map art with custom illustrated assets while keeping the same component boundary.
5. Add automated tests around the content-pack and locale-backed gameplay flows.

## Legacy References

Useful source material only:

- `../gwinnett-dope-wars/assets/js/data.js`
- `../gwinnett-dope-wars/assets/js/models.js`
- `../gwinnett-dope-wars/locales/dopewars.en-US.properties`

Port from them. Do not depend on them at runtime.
