# Local Dope Wars

Local Dope Wars is a modern JavaScript remake of the classic Dope Wars trading game.

The current built-in content pack is set in Gwinnett County, Georgia, but the long-term goal of this project is to make locations and related flavor content customizable without rewriting the game rules each time.

## Current Status

- Built with Vite, React, and TypeScript
- Pure typed game core for market generation, travel, buying, selling, banking, debt, and run scoring
- Dedicated SVG map scene for the default Gwinnett County layout
- Start new run / continue saved run flow
- Browser-local autosave and high scores
- Content-pack foundation for future alternate location packs

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
2. Each run starts with cash, debt, limited stash space, and the default Gwinnett map.
3. Travel between cities to advance the day and refresh the market.
4. Buy low and sell high while watching stash space, debt growth, and city heat.
5. Use the finance desk to deposit cash, withdraw reserves, pay debt, or borrow more money.
6. When the run clock reaches the final day, travel locks and you can finish liquidating inventory and settling finances.
7. Finalize the run to record a score on the local high-score board.

Notes:

- Runs autosave in browser localStorage.
- High scores are also stored locally in the browser.
- The current default content pack is Gwinnett County.

## Testing And Validation

This project now includes a small automated regression suite for the typed game core. The main validation flow is:

```bash
npm run lint
npm run test
npm run build
```

Or run both together:

```bash
npm run check
```

Or with Make:

```bash
make test
make check
```

For a static deploy under `https://malevolentgods.com/apps/local-dope-wars/`, build with:

```bash
make build-subpath
```

When changing gameplay or UI in meaningful ways, contributors should run `lint`, `test`, and `build` before finishing work.

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

Areas that are especially helpful:

- modern i18n
- deeper encounters and cops/heat systems
- persistent saves and endgame polish
- tests for the typed game core
- improved content-pack tooling for alternate locations
- art and map production upgrades

## License

This project is licensed under the [MIT License](./LICENSE).
