# ROADMAP.md

This roadmap applies to `/Users/oberon/Projects/coding/javascript/local-dope-wars`.

## Current Status

Completed:

- Vite + React + TypeScript greenfield app scaffold
- Typed game domain split into `src/game/types.ts`, `src/game/content.ts`, and `src/game/core.ts`
- Basic trading loop: travel, market generation, buy, sell, run-value tracking
- Modern shell UI with hero, stats, signal cards, news feed, and market board
- Dedicated SVG map scene in `src/components/MapScene.tsx`
- Art direction brief in `docs/art-direction.md`
- Local save/load, high scores, and run summary flow
- Finance layer with bank actions, debt pressure, bank yield, emergency pawn advances, pawnable defensive gear, and first-pass decision-based encounter choices
- Final-stretch endgame pressure with higher late-run risk and closeout score penalties for injuries and unsold stash
- Typed market event tables and heat/health encounter systems
- Text-first event spotlight popups for market shocks, collectors, and travel encounters
- Automated regression coverage for core gameplay, storage/save normalization, and key browser-like UI flows plus lint/test/build verification flow
- The current built-in content pack still defaults to the original Gwinnett County setting
- Browser-local JSON import for custom content packs, validated through the typed content layer and launcher picker

Still missing:

- Broader i18n coverage
- More bundled packs plus deeper import/export tooling for customizable location/content packs
- Deeper combat/endgame systems on top of the new defensive gear lane and initial encounter-choice flows
- Production-ready art assets
- Broader browser-level save/load and UI automated coverage beyond the current smoke paths
- Endgame polish and progression balance

## Guiding Priorities

1. Finish the game systems before over-investing in presentation polish.
2. Keep gameplay logic in `src/game/core.ts` and content in `src/game/content.ts`.
3. Preserve the current Gwinnett-flavored content as the default starter set, but do not hard-code it so deeply that alternate location packs become painful.
4. Preserve the current map/component boundary while upgrading visuals.
5. Ship a playable vertical slice before broadening scope too much.

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
- Add a typed popup/modal presentation layer for encounters and special market events
- Add more explicit difficulty tuning hooks in `src/game/content.ts`

Definition of done:

- A run involves meaningful risk management, not just buy/sell optimization

## Phase 3: Localization, Content, And Customization Layer

Goal:
Replace hard-coded UI text with a maintainable content system and turn the current Gwinnett-specific material into the default customizable starter pack.

Tasks:

- Introduce a modern i18n solution
- Move UI strings and event copy out of components
- Normalize all player-facing copy into a maintainable structure
- Define a typed configuration/content model for customizable location sets, labels, and related flavor data
- Ensure map labels, travel graph data, and location copy can be swapped without rewriting gameplay rules
- Keep the existing Gwinnett/Lawrenceville references as the built-in default content pack
- Expand default city descriptions, event flavor, and score messaging
- Audit all bundled city and item names for tone consistency

Definition of done:

- Text is no longer scattered across React components
- The app ships with the current Gwinnett content as its default pack
- New location/content packs can be added without touching gameplay logic

## Phase 4: Art And Interface Production

Goal:
Turn the current strong visual direction into a production-quality interface that still supports future alternate location packs.

Tasks:

- Replace generic chips and markers with custom iconography
- Add textured panel treatments and asset-backed visual layers
- Add more polished transitions for travel, special events, and end-of-run states
- Replace text-first event spotlight windows with illustrated encounter/event cards
- Introduce drug/item icon systems
- Add stronger mobile-specific UI refinement where necessary
- Keep the map/art pipeline modular enough that future location packs can supply their own scene assets

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
- Tune default city heat and availability profiles
- Tune run length and debt growth
- Review whether the market is too easy or too punishing
- Add a simple balancing worksheet or content notes for future tuning

Definition of done:

- The game has a coherent difficulty curve and replay value

## Near-Term Recommended Order

1. Save/load and endgame flow
2. Localization/content work for customizable location packs
3. Bank/pawn mechanics and defensive gear follow-through
4. Random events and cops/heat gameplay
5. Core and browser-level tests
6. Custom map art and iconography

## Nice-To-Haves

- Sound design and ambient audio
- Seasonal or alternate visual themes
- Character/contact system
- Achievements or run modifiers
- Advanced stats and post-run recap visuals

## Working Notes For Future Agents

- Do not treat the legacy app as runtime code.
- The legacy reference source lives in the sibling folder `../gwinnett-dope-wars/`.
- Keep new rules out of `App.tsx`.
- Preserve stable IDs for built-in default cities and drugs.
- Keep the current Gwinnett content as the default pack while designing new content systems to support alternate locations.
- Run `npm run lint` and `npm run build` before closing out non-trivial work.
