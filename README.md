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

**Live forecasts** for your own places: Open-Meteo and NWS, the worse of the two per hour
(`apps/mobile/src/data/live.ts`). Either source can fail and the other still gives a verdict; if both fail
the verdict is Unknown. Outside the US only Open-Meteo is used.

**Places**: "Use where I am now" (asks for location only when tapped), or search for where you will be
(phone geocoder for street addresses, Open-Meteo for town and place names). Places are stored on the device.
Three **example places** keep the design's go, caution and no-go scenarios on sample data, labelled as such.

**Map**: your places as pins coloured by verdict, with the word under each pin (react-native-maps: Apple
Maps on iOS, Google Maps on Android). It shows on the phone only; the browser preview shows a placeholder.

| Board | Route | Status |
|---|---|---|
| 10, 13, 14 · Now, version 2 | `/now` | Built. Loading, stale, failed and Unknown states added |
| Hourly segment | `/now` → Hourly | Built from the version 1 hourly rows |
| 11 · Raw data | `/now` → Raw data | Built. Shows each source, grid cell, problems and the real derivation |
| 3 · Pick your work | `/activities` | Built, plus places and buttons for adding a place and limits |
| 12 · Your limits | `/limits` | Built |
| 9 · Onboarding step 1 | `/onboarding` | Built |
| Onboarding step 2, Add a place, Map, Places, Forecast | various | **Not designed.** Built from existing components, marked on screen |

Not done yet: text messages, onboarding steps 3–4, radar and wind map layers, the wind icon,
iOS tab style. Activities other than crane use placeholder rules: see `docs/research/ACTIVITY_RULES.md`.

Licensing: Open-Meteo's free tier is non-commercial. A paid plan is needed before launch.
