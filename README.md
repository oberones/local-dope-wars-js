# Gwinnett County Dope Wars Modern

Greenfield rebuild scaffold for a modern Gwinnett County, Georgia version of the classic dope wars loop.

## What is here

- `src/game/content.ts`
  Canonical game content for drugs, cities, price bands, and score tiers.
- `src/game/core.ts`
  Pure gameplay functions for market generation, travel, buy/sell actions, and run-value math.
- `src/game/types.ts`
  Shared domain types for the game core and UI.
- `src/App.tsx`
  First-pass interface shell with a territory board, signal feed, and market cards.
- `docs/art-direction.md`
  Visual target for custom art, motion, map treatment, and FX work.

## Why this structure

The legacy app mixed game rules, localization, and DOM manipulation together. This rebuild starts by separating those layers so the visuals can become much more ambitious without another rewrite of the market logic.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Reference inputs from the legacy project

- `../assets/js/data.js`
- `../assets/js/models.js`
- `../locales/dopewars.en-US.properties`

These should be treated as source material, not runtime dependencies.

## Suggested next steps

1. Replace the temporary text strings with a proper i18n layer.
2. Add persistence for saved runs and high scores.
3. Replace the current CSS-driven map scene with bespoke illustration and animated overlays.
4. Expand the core with cops, random encounters, weapons, and bank gameplay.
