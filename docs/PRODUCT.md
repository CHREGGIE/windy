# Product

## One sentence

WindCheck tells someone whose work depends on the weather whether they can work, for which hours,
at a specific place, against their own limits.

## Who it is for

Launch focus (recommended, not yet confirmed): **crane and lifting** and **roofing**.
The origin user is a knuckle-boom crane operator who checks wind every morning to decide whether to operate.

Later activities, all the same engine with different limits: boating, golf, drone flying, tree work,
painting, concrete, fishing, outdoor events.

## Why this and not a weather app

Competitive scan (November 2026, not exhaustive):

- Crane sites are served by hardware: anemometers with apps (WINDCRANE, Scarlet Tech, Liebherr MyNotifier).
- Large contractors are served by on-site stations with quote pricing (Perry Weather, Cordulus).
- A wave of small go/no-go web apps exists for roofing, paving, concrete, painting (DecideWeather,
  MesoscaleWX, CanWork, StormSignal). None listed lifting.
- Gap: forecast-only, no-hardware planning for small lifting and work-at-height operators.

Differentiators to protect:

1. Per-machine limits entered by the user, not trade defaults.
2. Wind adjusted to working height.
3. A text message the evening before and when the verdict changes.
4. Transparency: a raw-data screen that shows the source and how each number was derived.

## What people hate about weather apps, and our commitments

| Complaint | Commitment |
|---|---|
| Inaccurate forecasts | Show confidence. Flag disagreement between sources. Show "Unknown" for missing data. Keep a log of forecast against outcome. |
| Ads in front of the answer | No ads. The verdict renders first. |
| Features moved behind a paywall | Fix the free/paid line before launch. Never move a feature from free to paid. |
| Notification spam, alerts for the wrong place | Three message types only, each tied to a saved place. |
| Location data sold | Never. Say so on the permission screen. Saved places work without tracking. |
| Clutter | One verdict; details behind Summary / Hourly / Raw data. |
| Confusing numbers | A plain word beside every number, and a one-line explanation on tap. |
| Apps contradict each other | Name the source and show the derivation. |

## Core concepts

- **Place**: a saved location (job site, marina, course). Has lat/long and a time zone.
- **Activity**: a rule set (crane, roofing, boating...). Holds limits, units and message settings.
- **Machine** (optional, crane only for now): wind limit and working height. The current design assumes one per activity.
- **Verdict**: go, caution, no-go, or unknown, per hour and rolled up per day.
- **Limit**: the user's own threshold. Caution begins at 80% of it.

## Messages

- Evening verdict for tomorrow, default 6:00 PM local.
- Morning confirmation, default 5:30 AM local.
- Change message when the verdict changes or workable hours shift by two or more.
- Official alert for a saved place.

Target one SMS segment. Verdict first, hours second, numbers last. Example:

> Tue Red Hook: GO 7a–2p (gusts 9–16). Caution 2–3p. NO-GO from 3p (26, limit 25). Wed GO. Thu NO-GO. Site reading governs.

## Navigation

Bottom bar with four tabs: **Now**, **Forecast**, **Map**, **Places**.
The pill at top right ("Crane · Red Hook") opens the activity and place switcher on every tab.
Limits and message settings live inside each activity, so there is no settings tab.

## Open decisions

| Decision | Recommendation | Status |
|---|---|---|
| Product name | "WindCheck" is a placeholder | Open |
| Now screen layout | Version 2 (shorter, has all three verdict states) | Owner likes both; not chosen |
| Wind-strength icon | A, the windsock | Just proposed; not chosen |
| Launch activities | Crane and roofing | Owner wants broad appeal; not settled |
| App framework | Expo / React Native | Not discussed with owner |
| Free vs paid line | Decide before launch | Open |
| Live lightning feed | Defer; ship forecast "storms possible" first | Paid feed, no pricing found |
| Map provider | Compare at build time | Open |
| Arrow next to the map pin | Replace with the compass marker | Owner dislikes arrows; not resolved |
| Two machines per activity | Add a machine list if real users need it | Open |
| Validation with the origin user | His real limit, working height, sites and decision time | Not yet collected |
