## Why

Block Drop has one look: a midnight-blue board with flat candy-colored cells.
The rules and controls are complete, so the next change is a design pass.
Players should be able to choose how the game looks and feels. Each look must
be cohesive. Swapping colors alone is not enough: the board, HUD, overlays,
controls, and the moment a row clears should all belong to the same world.

The game's colors are also spread across about 100 hard-coded values in
`app.css` and the Canvas controller. Supporting more than one look means first
replacing those values with one set of named design tokens. That cleanup is
part of this change.

## What Changes

- Add six cosmetic themes: **Classic** (current look, default), **Tron**,
  **Chocolate**, **Nature**, **Sketchbook**, and **Stained Glass**. The last
  two are new suggestions, explained in `art-direction.md`.
- Each theme defines:
  - piece colors
  - how cells, landing previews, and the board background are drawn on Canvas
  - UI design tokens: colors, radii, fonts, and the browser `theme-color`
  - a signature line-clear animation, such as melting bars in Chocolate,
    derezzing light in Tron, falling leaves in Nature, eraser scrubbing in
    Sketchbook, and shattering glass in Stained Glass
- Add a **Theme** picker to the pause menu as a group of swatch radio
  buttons. A choice applies immediately and is saved on the device under
  `games.block-drop.theme`. Missing, invalid, or unavailable values fall back
  to Classic.
- Replace hard-coded Block Drop colors with CSS custom properties. Themes set
  those properties from TypeScript, so one source of truth drives both Canvas
  and CSS.
- Themes are purely cosmetic. Rules, scoring, gravity, input, announcements,
  and accessible names do not change. Only line-clear timing varies by theme,
  and it is capped (see design).

## Capabilities

### New Capabilities

None. Themes are part of the existing `block-drop` capability.

### Modified Capabilities

- `block-drop`: adds theme selection and persistence, themed presentation,
  and themed line-clear feedback. The line-clear feedback and readable cells
  requirements are generalized so each theme can meet them in its own style.

## Impact

- New modules: `src/games/block-drop/themes.ts` and
  `src/games/block-drop/theme-renderers/*`.
- `controller.ts` delegates board, cell, landing-preview, line-clear, and
  veil drawing to the active theme renderer. It gains `setTheme()` and a
  `theme` option.
- `BlockDrop.tsx` adds the pause-menu picker, theme persistence, CSS
  variables on the game root, and a `data-theme` attribute. It also updates
  the document background and meta `theme-color` while mounted.
- `app.css` changes Block Drop selectors to use `--bd-*` tokens and adds a
  small amount of theme-specific decoration. Catalog styles stay the same.
- There are no new dependencies, image assets, or web fonts. All theme art is
  drawn procedurally or uses system font stacks, so the offline precache does
  not change.
