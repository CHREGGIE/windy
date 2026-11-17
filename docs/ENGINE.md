# Verdict engine

A pure function: forecast inputs plus limits in, hourly and daily verdicts out. No network, no clock,
no storage. `prototype/windcheck.py` is the reference implementation of sections 1 to 6.
Sections 7 to 9 are designed but not yet implemented anywhere.

## 1. Inputs

Per source, per hour: steady wind at 10 m, gust at 10 m, and wind at 80 m when the source has it.
Per job: place, working hours, gust limit (mph), working height (ft).

## 2. Height adjustment

Scale the 10 m gust to working height with the wind-shear power law:

    gust_at_h = gust_10m * (h_m / 10) ^ alpha

- `h_m` is working height in metres, floored at 10.
- If the source gives wind at 80 m and it exceeds wind at 10 m: `alpha = ln(v80 / v10) / ln(8)`.
- Otherwise `alpha = 0.20`.

Applying the wind ratio to gusts is deliberately conservative.

## 3. Combining sources

For each hour, compute the gust at height for every source and take the **maximum**.
`spread` is max minus min. If spread exceeds 5 mph in any working hour, mark the job **low confidence**.

## 4. Hourly state

- `NO-GO` if gust > limit
- `CAUTION` if gust >= 0.8 * limit
- `GO` otherwise

Display gusts rounded **up**, so a 25.4 mph gust never shows as 25 against a limit of 25.

## 5. Windows and the daily verdict

Merge consecutive hours with the same state into windows with a gust range.

- All hours GO: `GO`
- All hours NO-GO: `NO-GO`
- Any NO-GO hour, mixed: `PARTIAL` (shown as "Go until 2 PM")
- Otherwise: `CAUTION`

## 6. Change detection

Compare a run with the previous run for the same job. Send a change message when the daily verdict
differs, **or** the count of GO hours differs by two or more.

## 7. Official alerts (designed, not implemented)

An active wind-related alert for the place forces the verdict to at least CAUTION, so an alert never
sits on a "Go" screen. Show the alert as a banner under the hero. Show nothing when there is no alert.

## 8. Unknown (designed, not implemented)

If a source returns no data for an hour or day, the state is `UNKNOWN`. Never fill it with a neighbour's
value and never treat it as GO. If every source fails, the whole verdict is unknown and the UI says so.

## 9. Extra rules per activity (designed, not implemented)

Optional switches on the limits screen: lightning (no-go if storms are forecast), rain (caution above a
50% chance), freezing (caution below 32°F). The worst state across all enabled rules wins.

## Wind-strength levels for the icon

Absolute, independent of the user's limit. Thresholds are a first proposal.

| Level | Gust, mph |
|---|---|
| Calm | 0–5 |
| Light | 6–12 |
| Breezy | 13–20 |
| Strong | 21–30 |
| Severe | 31+ |

Shape shows strength. Colour shows the verdict.

## Test cases

From the prototype's fake-data run (`prototype/sample-run.jsonl`). Port these as unit tests first.

1. Limit 25, hourly gusts at height 9, 10, 10, 11, 12, 14, 16, 21, 26 for 7 AM to 3 PM
   → GO x7, CAUTION, NO-GO; daily `PARTIAL`; 7 GO hours.
2. Same job, later run with the wind arriving four hours early → 4 GO hours → change message fires
   even though the daily verdict is still `PARTIAL`.
3. Two sources differing by 7 mph → low confidence flag, verdict from the higher source.
4. Gust 25.4 against limit 25 → NO-GO, displayed as 26.
5. All hours below 80% of limit → `GO`. All hours above limit → `NO-GO`.
6. A source without 80 m wind uses alpha 0.20.
7. 14 mph at 10 m, working height 60 ft, alpha 0.20 → 15.8 mph, displayed as 16 (the raw-data screen's worked example).

## Known gaps

- The prototype sends one message per job. The product should send one digest per recipient per day.
- Messages ran 124–245 characters. Shorten to fit one SMS segment.
- Only Open-Meteo is wired in the prototype's live path, and that path is untested.
