# Screens

The design canvas is private to the owner: https://claude.ai/artifact/N9NT6tjN7H1usgubYYp7A7
Claude Code cannot open it. Ask the owner for image exports of any board you need to see.
`design/screens/` holds reference markup for some boards. Those files depend on the canvas runtime,
so read them for structure, sizes and colours; they will not render on their own.
None of the designs was visually verified after generation, and every value in them is a sample.

## Designed

| Board | What it is | Reference file | Notes |
|---|---|---|---|
| 1 · Live reading, go | Now screen, version 1, blue | not included | Long: conditions as status rows, hourly rows, map card |
| 2 · Live reading, caution | Now screen, version 1, yellow | not included | |
| 3 · Pick your work | Activity switcher sheet | `Activities.dc.html` | Opened from the top-right pill |
| 4 · The text message | Evening and change texts | `Text.dc.html` | Older plain style |
| 5 · Direction options | Five rejected or superseded direction ideas | not included | History only |
| 6 · Compass refinements | B1, B2, B3 | `Compass.dc.html` | **B2 was chosen** |
| 7 · Boating | Now screen for boating, red no-go, knots | not included | Tide curve, waves, current, lightning |
| 8 · Navigation | Tab map | `Nav.dc.html` | Four tabs and the switcher |
| 9 · Onboarding | Step 1: pick activities | `Onboard.dc.html` | Steps 2–4 not designed |
| 10 · Now, version 2 | Now screen, version 2, blue | not included | Edited by the owner on the canvas; the canvas is the source of truth |
| 11 · Raw data | Sources, readings, derivation | `Raw.dc.html` | |
| 12 · Your limits | Limit editor for one activity | `Limits.dc.html` | Assumes one machine |
| 13 · Now, no-go | Version 2, red | `NoGo.dc.html` | Best reference for the version 2 structure |
| 14 · Now, active alert | Version 2, yellow, alert banner | `Alert.dc.html` | |
| 15 · Wind icon | Five strengths, two styles | `Icon.dc.html`, `design/icons/*.svg` | Style not chosen |

## Version 1 and version 2 of Now

The owner considers both strong and has not picked one. Build version 2 as the default:
it is shorter, has all three verdict states, and matches the tab structure.
Version 1's hourly rows become the content of the "Hourly" segment and the Forecast tab.
Version 1's map card becomes the Map tab.

Version 2, top to bottom: hero; alert banner (only if active); Summary / Hourly / Raw data switch;
compass card beside peak-gust card; dark block (humidity, UV, temperature); rain for four days;
daylight; lightning row; "Text me if this changes" pinned above the navigation bar.

## Not yet designed

Needed for a first release:

1. **Forecast tab** — hour by hour, 7 days with one verdict each, best working window, tide table for boating.
2. **Map tab** — full-screen map, pin, radar layer, wind layer, tide and buoy stations.
3. **Places tab** — saved places with a verdict each; empty state.
4. **Add a place** — search or drop a pin.
5. **Onboarding steps 2–4** — location permission with the privacy promise; limits; text setup with phone verification.
6. **Problem states** on every screen — loading, offline, stale data, location denied, all sources failed.
7. **Hourly segment** on Now, in the version 2 style.

Soon after:

8. Message settings (which, when, quiet hours).
9. Work log — past verdicts against what happened.
10. Plans and upgrade.
11. Settings — units, account, data sources.
12. Home-screen widget and the notification layout.
13. Machine list, if users have more than one.

When a screen is undesigned, build it from the components in `docs/DESIGN_SYSTEM.md` and flag it for
the owner's review instead of inventing a new visual language.
