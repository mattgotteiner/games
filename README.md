# Games

A mobile-friendly game catalog built with Preact, TypeScript, and Vite.

## Development

```sh
npm install
npm run dev
```

Use `npm run check` to run the type check, component tests, and production
build.


The catalog contains Block Drop and Brick Burst. Direct game links are
`/games/?game=block-drop` and `/games/?game=brick-burst`. Both games work
offline after the production application has loaded online.

Brick Burst supports touch dragging, mouse steering, and ←/→ or A/D.
Tap, click, Space, or ↑ serves; P pauses and R restarts. Difficulty and
best score are saved on the device. Its implementation record and phone
review checklist are in `openspec/changes/archive/2026-10-22-add-brick-burst/`.
The accepted pace tuning and touch fixes are recorded in
`openspec/changes/archive/2026-10-22-increase-brick-burst-pace/review.md`.
