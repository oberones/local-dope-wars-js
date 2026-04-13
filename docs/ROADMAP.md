# ROADMAP.md

This roadmap applies to `/Users/oberon/Projects/coding/javascript/gwinnett-dope-wars/modern`.

## Current Status

Completed:

- Vite + React + TypeScript greenfield app scaffold
- Typed game domain split into `src/game/types.ts`, `src/game/content.ts`, and `src/game/core.ts`
- Basic trading loop: travel, market generation, buy, sell, run-value tracking
- Modern shell UI with hero, stats, signal cards, news feed, and market board
- Dedicated SVG map scene in `src/components/MapScene.tsx`
- Art direction brief in `docs/art-direction.md`
- Basic lint/build verification flow

Still missing:

- Save/load and high scores
- Modern i18n
- Deeper game systems
- Production-ready art assets
- Automated tests
- Endgame polish and progression balance

## Guiding Priorities

1. Finish the game systems before over-investing in presentation polish.
2. Keep gameplay logic in `src/game/core.ts` and content in `src/game/content.ts`.
3. Preserve the current map/component boundary while upgrading visuals.
4. Ship a playable vertical slice before broadening scope too much.

## Phase 1: Functional Vertical Slice

Goal:
Make the current rebuild feel like a complete playable loop, even if art is still partly placeholder.

Tasks:

- Add save/load support using local storage
- Add high score persistence and a proper end-of-run summary
- Add a start/new-run flow beyond the current reset button
- Add a visible run-over state when day limit is reached
- Add quantity validation and stronger feedback for edge cases
- Add a simple transaction history or activity log beyond the current news feed
- Add bank/deposit interactions to replace the missing financial layer

Definition of done:

- A player can start, play, finish, and restart a run without losing expected state accidentally
- The game loop feels complete enough for real playtesting

## Phase 2: Core Systems Expansion

Goal:
Bring back the missing mechanics that make the game feel deeper and less like a market demo.

Tasks:

- Add cops/heat events as actual gameplay, not just display flavor
- Add random encounters during travel or market actions
- Add health consequences and recovery paths
- Add weapons/guns or defensive inventory if that remains part of the design
- Add debt pressure and richer bank/pawn mechanics
- Add event tables for raids, shortages, floods, busts, and lucky breaks
- Add more explicit difficulty tuning hooks in `src/game/content.ts`

Definition of done:

- A run involves meaningful risk management, not just buy/sell optimization

## Phase 3: Localization And Content Layer

Goal:
Replace hard-coded UI text with a maintainable content system and deepen Gwinnett-specific flavor.

Tasks:

- Introduce a modern i18n solution
- Move UI strings and event copy out of components
- Normalize all player-facing copy into a maintainable structure
- Expand city descriptions, event flavor, and score messaging
- Audit all city and item names for tone consistency
- Add more Gwinnett/Lawrenceville-specific references where appropriate

Definition of done:

- Text is no longer scattered across React components
- New content can be added without touching gameplay logic

## Phase 4: Art And Interface Production

Goal:
Turn the current strong visual direction into a production-quality interface.

Tasks:

- Replace placeholder geometric map art with custom illustrated county artwork
- Add district landmark illustrations or iconography
- Replace generic chips and markers with custom iconography
- Add textured panel treatments and asset-backed visual layers
- Add more polished transitions for travel, special events, and end-of-run states
- Introduce drug/item icon systems
- Add stronger mobile-specific UI refinement where necessary

Reference:

- `docs/art-direction.md`

Definition of done:

- The game no longer reads as a polished prototype
- The interface feels distinct and memorable on both desktop and mobile

## Phase 5: Map Scene Upgrade Path

Goal:
Decide whether the SVG map remains the production approach or becomes the stepping stone to a richer scene system.

Options:

1. Stay on SVG
   Best if the goal is crisp illustrated motion with lower engineering overhead.
2. Move to Pixi or Canvas
   Best if the goal is heavier ambient effects, layered animation, and richer visual spectacle.

Tasks if staying on SVG:

- Refine path animation
- Add illustrated overlays
- Add event-specific scene states

Tasks if moving to Pixi:

- Keep `MapScene` as the component boundary
- Port rendering internals only
- Preserve current app/game-core integration

Definition of done:

- The map scene has a clearly chosen long-term rendering path

## Phase 6: Testing And Quality

Goal:
Make the project safer to extend.

Tasks:

- Add unit tests for `src/game/core.ts`
- Add coverage for market generation and state transitions
- Add regression tests for buy/sell/travel/save flows
- Add browser-level functional tests for the main gameplay loop
- Add a smoke-test checklist for design changes that may affect usability

Definition of done:

- Future refactors can happen with much lower breakage risk

## Phase 7: Balance And Playtest Pass

Goal:
Tune the game into something genuinely fun rather than merely functional.

Tasks:

- Review item price ranges and event frequency
- Tune city heat and availability profiles
- Tune run length and debt growth
- Review whether the market is too easy or too punishing
- Add a simple balancing worksheet or content notes for future tuning

Definition of done:

- The game has a coherent difficulty curve and replay value

## Near-Term Recommended Order

1. Save/load and endgame flow
2. Bank/pawn mechanics
3. Random events and cops/heat gameplay
4. Modern i18n
5. Core tests
6. Custom map art and iconography

## Nice-To-Haves

- Sound design and ambient audio
- Seasonal or alternate visual themes
- Character/contact system
- Achievements or run modifiers
- Advanced stats and post-run recap visuals

## Working Notes For Future Agents

- Do not treat the legacy app as runtime code.
- Keep new rules out of `App.tsx`.
- Preserve stable IDs for cities and drugs.
- Run `npm run lint` and `npm run build` before closing out non-trivial work.
