# WindCheck

Turns a wind forecast into a go / caution / no-go verdict against limits the user sets.
Product, engine and design docs are in `docs/` and `design/`. The canvas is the source of truth for visuals.

## Layout

| Path | What it is |
|---|---|
| `packages/engine` | Verdict engine in TypeScript. Pure: no network, clock or storage. Port of `prototype/windcheck.py` plus ENGINE.md sections 7–9. |
| `apps/mobile` | Expo (SDK 58) app with Expo Router. Android first, then iOS. |
| `design/tokens.json` | Design tokens. The app imports this file directly, so there is one copy. |
| `prototype/` | The original Python prototype and its sample run, used as a test fixture. |

## Run

```bash
npm install
npm test                       # engine tests, Node's built-in runner
npm run typecheck
cd apps/mobile && npx expo start
```

## What the app shows today

All numbers are **sample data** run through the real engine (`apps/mobile/src/data/samples.ts`).
The screens say so. Sunrise and sunset are calculated, not sampled.

| Board | Route | Status |
|---|---|---|
| 10 · Now, version 2 (go) | `/now` | Built. Crane · Red Hook |
| 13 · Now, no-go | `/now` | Built. Crane · Downtown |
| 14 · Now, active alert | `/now` | Built. Roofing · East New York |
| Hourly segment | `/now` → Hourly | Built from the version 1 hourly rows |
| 11 · Raw data | `/now` → Raw data | Built, with the real derivation |
| 3 · Pick your work | `/activities` | Built, plus a place list and a limits button (additions) |
| 12 · Your limits | `/limits` | Built. Changes recompute every verdict |
| 9 · Onboarding step 1 | `/onboarding` | Built. Steps 2–4 not designed |
| 8 · Navigation | bottom bar | Built (Android pill style) |
| Forecast, Map, Places | tabs | **Not designed.** Built from existing components and marked on screen for review |

Not done yet: live data (milestone 1), persistence, text messages, loading / offline / stale /
location-denied states, the wind icon (style not chosen), iOS tab style.
