# Commander Life Tracker (2026)

A Magic: The Gathering Commander life-tracker PWA, rebuilt to run on an **iPad Mini 2
(iOS 12.5 / Safari 12)** — the device most modern trackers won't load on.

## Why it's built the way it is

- **Vite + Preact**, with the production build targeted at `es2017` / `safari12`.
  esbuild transpiles modern syntax (`?.`, `??`, object spread, …) — including
  inside dependencies — so nothing parse-breaks on the old Safari.
- **No Pointer Events** (iOS 12 lacks them): touch + mouse handlers instead.
- **No flexbox `gap`** (unsupported until Safari 14.1): margins/padding instead.
- **Data-driven**: the whole UI renders from one game-state object
  ([src/state.js](src/state.js)) and seat layouts come from a config map
  ([src/layouts.js](src/layouts.js)), so new player counts/features are cheap.
- **Offline PWA**: a hand-written, ES5-safe service worker
  ([public/sw.js](public/sw.js)) caches everything after first load.

## Develop

```bash
npm install
npm run dev      # local dev server
npm run build    # outputs static files to dist/
npm run preview  # serve the production build locally
```

## Deploy (GitHub Pages)

Pushing to `main` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml),
which builds and publishes `dist/`. One-time setup in the repo:
**Settings → Pages → Source → GitHub Actions**.

The Vite `base` is `/LifeTracker2026/` — it must match the repo name, or assets
404. (If the repo is renamed, update `base` in [vite.config.js](vite.config.js).)

## Status

Phase 1 (foundation): variable 2–6 player layouts, life ± with press-and-hold,
running change indicator, format/starting-life presets, reset, persistence.

Planned: commander/poison/energy counters, friend profiles + win-rate stats,
dice/coin/first-player/timer, deck import.
