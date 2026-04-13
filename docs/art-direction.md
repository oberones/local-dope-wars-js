# Art Direction And FX Brief

## Creative thesis

This version should feel like a Southern suburban crime board after dark:

- humid night air
- amber sodium-vapor light
- green radar glow
- glossy black surfaces
- courthouse-square grit rather than neon-cyberpunk cliché

The interface should feel like a live operations desk, not a dashboard template.

## Visual pillars

1. Warm noir palette
   Burnt orange, old gold, patrol-light red, oxidized green, and tobacco black.
2. Surveillance framing
   Maps, route overlays, live markers, scanner sweeps, and evidence-board composition.
3. Contrast between polish and danger
   Clean cards and elegant typography over dirty textures, street heat, and volatile signals.

## Map scene target

The map should eventually become a custom illustrated scene with these layers:

1. Base county plate
   Stylized Gwinnett silhouette, arterial roads, district shading, and subtle topographic noise.
2. Live route network
   Animated path lights, node pulses, and route state changes when the player travels.
3. District callouts
   Lawrenceville square, Gas South corridor, Scenic Highway, and other anchor areas shown with bespoke labels.
4. Ambient effects
   Scanner sweeps, drifting haze, intermittent flare, and slow glow pulses around hot zones.

## UI motif

- Cards should feel like laminated case files or brushed control panels.
- Buttons should feel decisive and tactile, not generic app buttons.
- Data chips should read like tagged evidence labels.
- Typography should lean editorial and dramatic, with a serif display face over a cleaner sans body.

## Motion system

Use motion with intent:

1. Entry
   Panels rise in with slight stagger and a sense of weight.
2. Attention
   Active city nodes pulse softly; high-value routes shimmer; special market conditions glow.
3. Atmosphere
   Slow sweeps, haze drift, and route dash movement should create life without becoming noisy.
4. Restraint
   Avoid tiny constant micro-animations on every element.

## Custom asset backlog

### Priority 1

- Illustrated county map base
- Node icons for each city
- Signal/heat icon set
- Textured panel backgrounds

### Priority 2

- Drug family icons
- Event-specific overlays for raids, shortages, and floods
- Animated route streak sprites
- End-of-run score scene art

### Priority 3

- Character portraits or silhouettes for contacts
- District postcard art for travel transitions
- Alternate themes for special events or seasonal builds

## FX tokens to standardize

- `glow-low`
  Soft green or amber bloom for idle states.
- `glow-hot`
  Stronger amber/red bloom for expensive or dangerous conditions.
- `scan-sweep`
  Slow linear pass used sparingly over maps or large panels.
- `route-flow`
  Directional dash motion on active travel lines.
- `pulse-ring`
  Expanding ring around the active city.

## Implementation note

The current React shell intentionally keeps game logic in `src/game/core.ts`, so the map scene can later be swapped from CSS and DOM into SVG, Canvas, or Pixi without rewriting the rules layer again.
