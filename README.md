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
- Browser-local custom content-pack import from JSON
- Finance desk with deposits, withdrawals, debt payoff, borrowing, pawn advances, and recovery
- Pawnable defensive gear with defense rating and gear value tracking
- Event spotlight popup windows for market shocks, collector hits, and travel encounters
- First-pass decision-based encounter choices for cop stops and rival-crew ambushes

This is the greenfield rebuild. The legacy Dope Wars codebase in `../gwinnett-dope-wars/` is reference material only and is not used at runtime.

## Install

1. Clone the repository.
2. Change into the project directory:

```bash
cd local-dope-wars
```

3. Select Node.js 24.22.1 with the npm version bundled with it. Node 24 is the supported development and build runtime; Node 20 and 22 are no longer supported. If you use nvm:

```bash
nvm install
nvm use
```

The repository's `.nvmrc` pins the version. Other version managers should select the same Node release; no global npm upgrade is required.

4. Install the dependencies recorded in the lockfile:

```bash
npm ci
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
2. New runs start on the currently selected content pack. Saved runs keep their original pack.
3. Each run starts with cash, debt, limited stash space, and a market that refreshes when you travel.
4. Travel between cities to advance the day, refresh the market, and trigger heat-based encounter risk.
5. Buy low and sell high while watching stash space, debt growth, city heat, and special market events.
6. Use the finance desk to deposit cash, withdraw reserves, pay debt, borrow more money, take pawn advances, patch up, and manage gear.
7. Buy weapons and defensive gear to improve your defense rating, then pawn duplicate gear later for diminishing returns.
8. When special events or encounters fire, read the popup window and resolve it. Cop stops and rival-crew ambushes now let you `fight`, `flee`, or `surrender`, with different cash or stash consequences.
9. When the run clock reaches the final day, travel locks and you can finish liquidating inventory and settling finances.
10. Finalize the run to record a score on the local high-score board.

Notes:

- Runs autosave in browser localStorage.
- High scores are also stored locally in the browser.
- The current built-in default content pack is Gwinnett County.
- Imported custom packs stay local to the current browser and appear in the same launcher picker.
- Travel encounters, collector pressure, market shocks, and gear value all feed into the current run state.

## Current Bundled Locations

- `Gwinnett County` (default starter pack)
  Locations: Duluth, Suwanee, Norcross, Snellville, Lawrenceville, Lilburn, Grayson, Dacula
- `Atlanta Intown`
  Locations: Midtown, Buckhead, Little Five, Old Fourth Ward, Decatur, West End, Summerhill, East Atlanta

## Importing A Custom Pack

If you already have a valid content-pack JSON file, you can import it directly from the launch screen:

1. Open the `Import local pack JSON` lane in the launcher.
2. Choose a `.json` file from your machine.
3. The pack is validated, added to the browser-local registry, and immediately appears in the pack picker.

Notes:

- Imported packs are stored only in the current browser.
- They do not replace the built-in Gwinnett default.
- Saved runs and selected-pack state can use imported packs as long as that pack still exists in browser storage.

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

## GHCR Publishing And Manual Hera Deployment

[`.github/workflows/publish.yml`](.github/workflows/publish.yml) verifies pull requests targeting `main`, pushes to `main`, and version-tag pushes with Node `24.22.1`, `npm ci`, lint, tests, the production build, production Compose validation, and a Docker image build. Publishing runs only after verification succeeds for a pushed release tag in `X.Y.Z` format (for example, `0.10.2`), matching Commitizen's existing `$version` tag convention. Pull requests and branch pushes run verification only. Each release publishes:

- `ghcr.io/oberones/local-dope-wars-js:<version>` (for example, `:0.10.2`)
- `ghcr.io/oberones/local-dope-wars-js:latest`
- `ghcr.io/oberones/local-dope-wars-js:sha-<full-40-character-commit-sha>`

Release-tag workflow runs share a concurrency group to prevent overlapping publications. Actions are pinned to commit SHAs, Docker builds use Buildx caching, and published images carry OCI source, revision, and version labels. Publishing uses `GITHUB_TOKEN`; only the publish job receives `packages: write`. No server credentials are needed: GitHub publishes the image, and an operator pulls it on Hera. Version bumps, changelog generation, and creating/pushing release tags remain manual release operations managed with Commitizen; the tagged commit must contain this workflow.

Published images target `linux/amd64` and compile asset URLs for `/apps/local-dope-wars/`. Hera's architecture is an assumption: confirm it with `docker info --format '{{.Architecture}}'` before deploying (expect `x86_64` or `amd64`). Other architectures need a separately verified image target. The existing Dockerfile and local Compose builds still default to `/`.

### First-time setup on Hera

Install Docker Engine with the Compose plugin, and use an account allowed to run Docker. After the first successful publication, copy [`deploy/compose.production.yml`](deploy/compose.production.yml) to a dedicated directory on Hera as `compose.yml`, for example `/opt/local-dope-wars/compose.yml`. That directory needs only the Compose file and its `.env`; Node, source files, and a local image build are unnecessary.

GHCR initially creates packages as private, and this workflow does not change visibility. For a private package, use a GitHub account with package read access and a personal access token **(classic)** with `read:packages` (authorize SSO if required). Authenticate as the same Hera account that will run Compose; enter the token at Docker's password prompt:

```bash
docker login ghcr.io --username YOUR_GITHUB_USERNAME
```

Keep registry credentials out of Compose and `.env`. If the package is deliberately made public later, anonymous pulls are supported. See [GitHub's Container registry authentication guidance](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry#authenticating-to-the-container-registry). If the package already existed before this workflow, ensure this repository has Actions write access to it.

In the deployment directory, create `.env` with the selected tag from a successful workflow run. Replace the placeholder with the full commit SHA, not a shortened SHA:

```dotenv
IMAGE_TAG=sha-<full-40-character-commit-sha>
LOCAL_DOPE_WARS_PORT=8081
LOCAL_DOPE_WARS_NETWORK=web-backend
```

Persist the selected SHA tag here for repeatable updates and record the previous tag before changing it. If `IMAGE_TAG` is absent or empty, Compose defaults to `latest`. Shell environment variables override `.env`, so clear any old shell override before using the commands below.

```bash
cd /opt/local-dope-wars
unset IMAGE_TAG
docker network inspect web-backend >/dev/null 2>&1 || docker network create web-backend
docker compose --env-file .env config --quiet
docker compose --env-file .env pull local-dope-wars
```

If using a different existing proxy network or host port, retain those settings in `.env` and inspect that network instead. The reverse proxy must share the selected external network.

### Replace an existing local-build container

Pull the new image first, then remove the old app container before starting the new service: both configurations intentionally use the name `local-dope-wars`. From the old checkout, use its original Compose project name/options if they differ from the defaults:

```bash
docker compose --file docker-compose.yml stop local-dope-wars
docker compose --file docker-compose.yml rm --force local-dope-wars
```

For a container originally started without Compose, use `docker stop local-dope-wars` followed by `docker rm local-dope-wars` instead. Keep the old checkout/image until acceptance. Do not start a second stack with the same container name or use the old `make docker-up` command after cutover. This replacement causes a brief outage; saves and imported packs remain in browser storage at the existing public origin.

Start the pulled image from the new deployment directory:

```bash
cd /opt/local-dope-wars
docker compose --env-file .env up --detach --no-build --wait --wait-timeout 120 local-dope-wars
```

Keep the proxy upstream `http://local-dope-wars:8080/` and the [prefix-stripping Nginx configuration below](#local-container-builds-and-proxy-configuration). Reload the proxy if it caches the replaced container's IP. The image serves files at `/`; the proxy strips `/apps/local-dope-wars/` from incoming public requests. Changing a runtime environment variable cannot change the compiled base path.

### Manual updates, health checks, and rollback

For each update, choose a successfully published SHA tag, record the current tag, and edit `IMAGE_TAG` in `/opt/local-dope-wars/.env`. Then run:

```bash
cd /opt/local-dope-wars
unset IMAGE_TAG
docker compose --env-file .env config --quiet
docker compose --env-file .env pull local-dope-wars
docker compose --env-file .env up --detach --no-build --wait --wait-timeout 120 local-dope-wars
docker compose --env-file .env ps
docker inspect --format '{{.Config.Image}} {{.State.Health.Status}}' local-dope-wars
docker inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' local-dope-wars
docker compose --env-file .env exec local-dope-wars nginx -t
docker compose --env-file .env logs --tail=100 local-dope-wars
curl --fail --show-error --silent -I http://127.0.0.1:8081/index.html
curl --fail --show-error --silent https://malevolentgods.com/apps/local-dope-wars/
```

Use the configured host port if it differs from `8081`. Confirm that the inspected image tag and revision match the selected commit and health is `healthy`. Copy a generated JavaScript URL from the public HTML: it must begin `/apps/local-dope-wars/assets/` and return `200` with a JavaScript content type through the public proxy. Request the corresponding `/assets/...js` path directly on the loopback port, since that request bypasses prefix stripping. A missing asset such as `/apps/local-dope-wars/assets/does-not-exist.js` must return `404` publicly (and `/assets/does-not-exist.js` must return `404` directly). Finally, open the public page in a browser and verify both starting a new run and continuing a saved run.

To roll back, set `IMAGE_TAG` in `.env` to the **previous successfully published SHA tag**, then repeat the same pull, start, and health/public/browser checks. Persisting the rollback tag prevents the next Compose invocation from silently reverting to `latest`. Keep the previous GHCR tag available until the new release is accepted.

Local lint/tests/build, Compose validation, workflow linting, and container smoke tests do not establish hosted or Hera acceptance. After an authorized version-tag push, separately confirm the GitHub workflow passes and GHCR contains the version, `latest`, and expected full-SHA tags for `linux/amd64`. Hera acceptance requires the manual pull and checks above; the workflow does not connect to or deploy onto Hera.

## Local Container Builds And Proxy Configuration

The repository now includes container and deployment helpers for production:

```bash
make docker-config
make docker-build
make docker-up
make docker-down
make docker-logs
```

The container follows the read-only, unprivileged Nginx pattern used in `../soundbox`:

- Nginx runs as UID/GID `101:101` on container port `8080`.
- The root filesystem is read-only, all Linux capabilities are dropped, and privilege escalation is disabled.
- Nginx's PID and temporary files live in a 16 MiB `/tmp` tmpfs with `noexec`, `nosuid`, and `nodev`. Logs go to stdout/stderr, with Docker log rotation and a 64-process limit.
- Only the built static app is served. The build context is limited to package manifests, source, public assets, build configuration, and Nginx configuration; local `.env*` files, Git metadata, and existing `dist/` output are excluded.
- The published host port is restricted to loopback. Terminate public HTTPS at your reverse proxy.

`docker-compose.yml` joins the external Docker network `web-backend`. Create it only if it does not already exist, then build and start the app:

```bash
docker network inspect web-backend >/dev/null 2>&1 || docker network create web-backend
docker compose config --quiet
docker compose build --pull
docker compose up -d --wait
```

For a dedicated hostname or local use, Docker builds continue to default `VITE_BASE_PATH` to `/`. Open `http://127.0.0.1:8081/`. Set `LOCAL_DOPE_WARS_PORT` to change the host port, or `LOCAL_DOPE_WARS_NETWORK` to join a different existing proxy network. Compose settings can be stored in a local `.env` file; it is excluded from the build context. Pass browser build settings through explicit build arguments, not environment files copied into the image.

**Existing container deployments must update their proxy upstream from port `80` to `8080`.** A containerized proxy on the shared network should use `http://local-dope-wars:8080`; a proxy running on the host should use `http://127.0.0.1:8081`. Direct access to the host port from other machines is now disabled.

For the existing `/apps/local-dope-wars/` deployment, build the container with that public base path:

```bash
VITE_BASE_PATH=/apps/local-dope-wars/ docker compose build --pull
docker compose up -d --wait
```

Add these locations to the reverse proxy's HTTPS server block (use `127.0.0.1:8081` as the upstream instead if the proxy runs on the host):

```nginx
location = /apps/local-dope-wars {
    return 301 /apps/local-dope-wars/;
}

location /apps/local-dope-wars/ {
    proxy_pass http://local-dope-wars:8080/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

The trailing slash on `proxy_pass` strips the public prefix before forwarding to the container. Rebuild when changing `VITE_BASE_PATH`; a runtime environment variable cannot change the compiled asset URLs. Reload the proxy after recreating the app if it caches the old container IP.

Check operation with:

```bash
docker compose ps
docker compose exec local-dope-wars nginx -t
curl -I http://127.0.0.1:8081/index.html
docker compose logs --tail=100 local-dope-wars
```

Also check a generated `/assets/` JavaScript URL from the served HTML: it must return `200` with a JavaScript content type, while a missing asset must return `404`. Repeat through the public URL after configuring the proxy, then verify starting and continuing a run in a browser. Saves and imported packs remain in browser storage; the container needs no persistent volume.

Use Compose to apply the runtime restrictions; a bare `docker run` does not automatically apply the read-only filesystem, tmpfs, capability, or resource settings. Review the pinned Node and Nginx image versions when applying upstream security updates and rebuild with `--pull`.

The app container is optional if your existing Nginx serves static files directly: build `dist/`, mount it read-only into that container, and configure the public path, asset caching, and SPA fallback there. The Compose setup above keeps the app independently deployable behind a reverse proxy.

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

If you want to add another bundled location pack in source:

1. Add or clone a pack definition in `src/game/content.ts`.
2. Follow the typed shapes in `src/game/types.ts`, especially `ContentPackDefinition`, city definitions, drug definitions, and map scene data.
3. Provide:
   - a stable `id`, `label`, `shortLabel`, `description`, and `accent`
   - a `startingCityId`
   - `cities`, `drugs`, and `scoreTiers`
   - `map.routes`, `map.districts`, `map.arterials`, and `map.labels`
4. Register the new pack through the content registry in `src/game/content.ts` so it appears in the launcher pack picker.
5. Keep gameplay rules in `src/game/core.ts` unchanged unless you are intentionally adding a new mechanic. New packs should fit the existing typed content model.
6. Run `npm run test`, `npm run lint`, and `npm run build` or just `make check`.

If you want to prototype without changing source first, use the launch-screen JSON import path and shape your file to match `ContentPackDefinition`.

The current bundled packs in `src/game/content.ts` are still the best examples to copy when creating a new pack.

Areas that are especially helpful:

- modern i18n
- deeper encounter choices and combat systems
- persistent saves and endgame polish
- tests for the typed game core and browser flows
- improved content-pack tooling for alternate locations
- art and map production upgrades

## License

This project is licensed under the [MIT License](./LICENSE).
