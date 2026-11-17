# Build plan

Each milestone ends with something the owner can check. Do not start a milestone until the previous
one's acceptance criteria pass. Confirm the stack in `CLAUDE.md` with the owner before milestone 0.

## Milestone 0 — Engine as a tested library

- Create the repo and a TypeScript package for the engine, with no I/O.
- Port `prototype/windcheck.py` sections 1–6 of `docs/ENGINE.md`.
- Port every test case in `docs/ENGINE.md`.

Accepted when: all test cases pass, and the engine's output for the prototype's fake data matches
`prototype/sample-run.jsonl` hour for hour.

## Milestone 1 — Real data

- Fetch NWS and Open-Meteo for three real Brooklyn locations. Save responses as fixtures.
- Write adapters that turn each response into the engine's input shape.
- Correct `docs/DATA_SOURCES.md` wherever the real responses differ from what it says.
- Add retry, backoff and fallback. Add the Unknown state (ENGINE section 8).

Accepted when: a command prints a verdict for a real address from live data, and still prints a
sensible result with either source switched off.

## Milestone 2 — The owner's first user, by text

- Supabase tables: places, activities, machines, jobs, recipients, runs.
- A scheduled function: evening run, morning run, change detection, one digest per recipient.
- Send by email first; switch to SMS when carrier registration clears.
- Log every run with the forecast used.

Accepted when: the origin user receives a correct evening and morning message for his real sites for
five consecutive days. This needs his real limit, working height, sites and decision time, which have
not been collected yet.

## Milestone 3 — App shell and the Now screen

- Expo app, navigation with four tabs, the design tokens, fonts.
- Now screen, version 2, in all three verdict states plus unknown, loading, offline, stale.
- Activity and place switcher. Limits editor.

Accepted when: the app on an Android device shows the same verdict as the text message for the same
place and limits, and the owner approves the screen against the canvas.

## Milestone 4 — The other tabs

- Forecast, Places and Add a place. Map last, since it needs a tile provider decision.
- Onboarding, including the location permission screen with the privacy promise.
- Alert banner and the alert-forces-caution rule (ENGINE section 7).

Accepted when: a new user can install, pick an activity, set a limit, save a place and get a verdict
without help.

## Milestone 5 — Second activity and release prep

- Roofing rules (gusts, rain, temperature), then boating (knots, tides via CO-OPS).
- Store listings, privacy policy, the disclaimer in onboarding and on every verdict surface.
- iOS build.

## Deliberately not in scope yet

Live lightning strikes, radar imagery, payments, multiple machines per activity, the work log,
widgets. Each is listed in `docs/SCREENS.md` or `docs/PRODUCT.md` with the reason it waits.
