# Local Dope Wars

Local Dope Wars is a modern JavaScript remake of the classic Dope Wars trading game.

The current built-in content pack is set in Gwinnett County, Georgia, but the long-term goal of this project is to make locations and related flavor content customizable without rewriting the game rules each time.

## Current Status

- Built with Vite, React, and TypeScript
- Pure typed game core for market generation, travel, buying, selling, banking, debt, encounters, and run scoring
- Dedicated SVG map scene for the default Gwinnett County layout
- Start new run / continue saved run flow
- Browser-local autosave and high scores
- Multiple bundled content packs with a launch-screen pack picker
- Finance desk with deposits, withdrawals, debt payoff, borrowing, pawn advances, and recovery
- Pawnable defensive gear with defense rating and gear value tracking
- Event spotlight popup windows for market shocks, collector hits, and travel encounters
- First-pass cop-stop encounter choices with `fight`, `flee`, and `surrender`

This is the greenfield rebuild. The legacy Dope Wars codebase in `../gwinnett-dope-wars/` is reference material only and is not used at runtime.

## Install

1. Clone the repository.
2. Change into the project directory:

```bash
cd local-dope-wars
```

3. Install dependencies:

```bash
npm install
```

Or use the Makefile wrapper:

```bash
make install
```

## Run The App

Start the local development server:

```bash
npm run dev
```

Or:

```bash
make dev
```

Then open the local Vite URL shown in the terminal.

Useful additional commands:

```bash
npm run preview
npm run lint
npm run build
npm run test
npm run check
```

Makefile equivalents:

```bash
make preview
make lint
make build
make build-subpath
make test
make check
make help
```

`make build-subpath` defaults to `SUBPATH_BASE=/apps/local-dope-wars/`. You can override it for another mount point:

```bash
make build-subpath SUBPATH_BASE=/apps/some-other-path/
```

## How To Play

1. Launch the app and choose `Start new run` or `Continue saved run`.
2. New runs start on the currently selected bundled content pack. Saved runs keep their original pack.
3. Each run starts with cash, debt, limited stash space, and a market that refreshes when you travel.
4. Travel between cities to advance the day, refresh the market, and trigger heat-based encounter risk.
5. Buy low and sell high while watching stash space, debt growth, city heat, and special market events.
6. Use the finance desk to deposit cash, withdraw reserves, pay debt, borrow more money, take pawn advances, patch up, and manage gear.
7. Buy weapons and defensive gear to improve your defense rating, then pawn duplicate gear later for diminishing returns.
8. When special events or encounters fire, read the popup window and resolve it. Cop-stop encounters now let you `fight`, `flee`, or `surrender`.
9. When the run clock reaches the final day, travel locks and you can finish liquidating inventory and settling finances.
10. Finalize the run to record a score on the local high-score board.

Notes:

- Runs autosave in browser localStorage.
- High scores are also stored locally in the browser.
- The current built-in default content pack is Gwinnett County.
- Travel encounters, collector pressure, market shocks, and gear value all feed into the current run state.

## Current Bundled Locations

- `Gwinnett County` (default starter pack)
  Locations: Duluth, Suwanee, Norcross, Snellville, Lawrenceville, Lilburn, Grayson, Dacula
- `Atlanta Intown`
  Locations: Midtown, Buckhead, Little Five, Old Fourth Ward, Decatur, West End, Summerhill, East Atlanta

## Testing And Validation

This project now includes automated regression coverage for the typed game core, storage/save normalization, and key browser-like UI flows. The main validation flow is:

```bash
npm run lint
npm run test
npm run build
```

`npm run build` defaults `VITE_BASE_PATH` to `/apps/local-dope-wars/` for the current deployment target. Override `VITE_BASE_PATH` explicitly only when building for a different mount point.

Or run both together:

```bash
npm run check
```

Or with Make:

```bash
make check
```

For the current static deploy target under `https://malevolentgods.com/apps/local-dope-wars/`, build with:

```bash
make build-subpath
```

When changing gameplay or UI in meaningful ways, contributors should run `lint`, `test`, and a base-path-aware build before finishing work.

## Deployment Helpers

The repository now includes container and deployment helpers for production:

```bash
make docker-config
make docker-build
make docker-up
make docker-down
make docker-logs
```

`docker-compose.yml` joins the external Docker network `ai-backend`, so that network must already exist on the target host.

For static deployments under a subpath, build with the correct Vite base path before uploading `dist/`:

```bash
VITE_BASE_PATH=/apps/local-dope-wars/ npm run build
```

or use:

```bash
make build-subpath
```

## Project Structure

- `src/game/types.ts`
  Shared game and content-pack types
- `src/game/content.ts`
  Default bundled content, score tiers, and map data
- `src/game/core.ts`
  Pure gameplay rules and state transitions
- `src/game/storage.ts`
  Browser-local save and high-score persistence
- `src/App.tsx`
  High-level app flow and UI composition
- `src/components/MapScene.tsx`
  SVG map scene rendering and interaction
- `docs/ROADMAP.md`
  Planned phases and next major work
- `docs/art-direction.md`
  Visual direction and design intent
- `AGENTS.md`
  Working rules and implementation guidance for contributors and coding agents

## Contributing

Contributions are welcome.

Recommended workflow:

1. Read `AGENTS.md` and `docs/ROADMAP.md` before making substantial changes.
2. Keep gameplay rules in `src/game/core.ts` and structured content in `src/game/content.ts`.
3. Do not import runtime code from the legacy project.
4. Run:

```bash
npm run lint
npm run test
npm run build
```

Or:

```bash
make check
```

5. If you create commits for shared work, use Conventional Commits and include a short subject like `feat: add encounter events`, a brief body describing what changed, and a validation note such as `Validation: npm run lint && npm run test && npm run build`.

### Adding A Custom Location Pack

If you want to add another bundled location pack:

1. Add or clone a pack definition in `src/game/content.ts`.
2. Follow the typed shapes in `src/game/types.ts`, especially `ContentPackDefinition`, city definitions, drug definitions, and map scene data.
3. Provide:
   - a stable `id`, `label`, `shortLabel`, `description`, and `accent`
   - a `startingCityId`
   - `cities`, `drugs`, and `scoreTiers`
   - `map.routes`, `map.districts`, `map.arterials`, and `map.labels`
4. Add the new pack to the exported `CONTENT_PACKS` list in `src/game/content.ts` so it appears in the launcher pack picker.
5. Keep gameplay rules in `src/game/core.ts` unchanged unless you are intentionally adding a new mechanic. New packs should fit the existing typed content model.
6. Run `npm run test`, `npm run lint`, and `npm run build` or just `make check`.

The current bundled packs in `src/game/content.ts` are the best examples to copy when creating a new pack.

Areas that are especially helpful:

- modern i18n
- deeper encounter choices and combat systems
- persistent saves and endgame polish
- tests for the typed game core and browser flows
- improved content-pack tooling for alternate locations
- art and map production upgrades

## License

This project is licensed under the [MIT License](./LICENSE).
