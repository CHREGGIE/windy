# Data sources

"Verified" means confirmed from a source during planning. "Unverified" means recalled or inferred;
confirm against live documentation before relying on it. No endpoint here has been called from our code.

| Need | Source | Cost | Status |
|---|---|---|---|
| Hourly wind, gusts, rain chance and amount, temperature, humidity | NWS API, `api.weather.gov` | Free, any purpose | Verified: open data, no key, a User-Agent header is required, rate limit unpublished |
| Official alerts (Wind Advisory, Small Craft Advisory) | NWS API alerts endpoint | Free | Verified that alerts are filterable by area; filtering by point is unverified |
| Wind at 80 m, second opinion on gusts | Open-Meteo | Free tier non-commercial; paid for commercial | **Unverified licence terms. Check before launch.** |
| Tide times and heights | NOAA CO-OPS API | Free, no key | Verified. About 3,450 US prediction stations. High/low or 15-minute interval. |
| Tidal currents | NOAA CO-OPS API | Free | Verified for dedicated currents stations only |
| Observed waves, water temperature | NOAA NDBC buoys | Free | Verified the network exists (about 150 stations). Coverage near a given marina varies. Access format unverified. |
| Marine zone forecast | NWS API zones endpoints | Free | Endpoint exists; wave fields per point unverified |
| Thunderstorm chance (forecast) | NWS gridpoint data | Free | **Unverified field name** |
| Live lightning strikes | Commercial: Xweather, Tempest, AccuWeather, OpenWeather | Paid, no public pricing found | Deferred. Blitzortung prohibits commercial use. |
| UV index | EPA forecast feed or Open-Meteo | Unknown | **Unverified. Not in the NWS API as far as known.** |
| Sunrise, sunset | Calculated from location and date | Free | No feed needed |
| Radar imagery | Separate NOAA map service | Free | **Unverified. Not part of `api.weather.gov`.** |
| Base map tiles | Mapbox, Google, or OpenStreetMap-based | Varies | Not yet compared |

## NWS API notes

- Two-step lookup: resolve lat/long with `/points/{lat},{lon}`, then call the forecast URLs it returns.
  Cache the grid cell per place.
- The raw gridpoint data is believed to use time intervals and metric units. Parse and convert to mph. Unverified.
- No wind at height. Use the power law, or Open-Meteo's 80 m wind.
- Occasional 500/503 responses are reported. Retry with backoff and fall back to the second source.
- US only.

## Recommended arrangement

- NWS is the primary source and the basis of the verdict.
- Open-Meteo is the second source and supplies wind at height.
  A review analysis found apps on a single government feed draw more accuracy complaints, which argues for two sources from day one.
- Take the worse of the two per hour and flag disagreement above 5 mph.

## Things to do before any of this is trusted

1. Call each endpoint for a real Brooklyn location and save the responses as fixtures.
2. Confirm units and field names against those fixtures, then correct this file.
3. Confirm Open-Meteo commercial terms.
4. Start SMS carrier registration.

## Checked against live responses (17 Nov 2026)

Saved in `packages/engine/test/fixtures/` and parsed in `packages/engine/src/adapters.ts`.

- **Open-Meteo forecast**: hourly values keyed by local time when `timezone=auto`, with `utc_offset_seconds`.
  `wind_speed_unit=mph` returns `mp/h`. `wind_speed_80m` is present. No thunder probability: the adapter
  treats weather codes 95, 96, 99 as thunderstorms. UV index is available here (not in NWS).
- **Open-Meteo geocoding**: place names only (towns, parks, landmarks). It does not resolve street addresses.
  "Red Hook" matches Red Hook, NY (Dutchess County), not the Brooklyn neighbourhood. The app uses the
  phone's own geocoder (expo-location) for addresses and this for names.
- **NWS `/points`**: Red Hook resolves to grid `OKX 33,40` (not 34,32 as on the Raw data board), time zone
  `America/New_York`. Outside the US it returns 404; the app then uses Open-Meteo alone.
- **NWS gridpoint data**: confirmed metric. Wind and gusts in `wmoUnit:km_h-1`, temperatures in `wmoUnit:degC`,
  precipitation in `wmoUnit:mm`. Values cover ISO 8601 intervals (`2026-11-17T03:00:00+00:00/PT2H`),
  which the adapter spreads across each hour. `probabilityOfThunder` exists (percent, no unit given).
  `lightningActivityLevel` was empty. `windGust`, `ceilingHeight`, `visibility` and wave fields exist.
- **NWS alerts** `/alerts/active?point=lat,lon`: filtering by point works (was unverified). No active alerts
  at the time of the fixture.
- **Thunder threshold**: the app treats NWS thunder probability of 15% or more ("slight chance") as storms
  possible. This is a proposal for the owner to confirm.
