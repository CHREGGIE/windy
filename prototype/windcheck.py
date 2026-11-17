#!/usr/bin/env python3
"""WindCheck MVP: go/no-go wind planning for lifting work.

  python3 windcheck.py            # fake Brooklyn jobs + fake forecast (evening, then morning run)
  python3 windcheck.py --live     # same fake jobs, real Open-Meteo forecast (needs internet; UNTESTED)

Everything in SITES / MACHINES / JOBS is made up for testing.
"""
import json, math, sys, urllib.request
from datetime import date, timedelta

# ---------------------------------------------------------------- fake data
SITES = {
    "redhook":  {"name": "Red Hook yard",      "lat": 40.675, "lon": -74.012},
    "downtown": {"name": "Downtown Bklyn",     "lat": 40.692, "lon": -73.985},
    "eny":      {"name": "East New York lot",  "lat": 40.666, "lon": -73.882},
}
MACHINES = {
    "knuckle": {"name": "Knuckle boom", "limit_mph": 25, "height_ft": 60},
    "boomtrk": {"name": "Boom truck",   "limit_mph": 30, "height_ft": 100},
}
DAY1 = date(2026, 11, 17)  # "tomorrow" for the test
JOBS = [  # site, machine, day offset from DAY1, start hour, end hour (24h, end exclusive)
    {"id": 1, "site": "redhook",  "machine": "knuckle", "day": 0, "start": 7, "end": 16},
    {"id": 2, "site": "downtown", "machine": "boomtrk", "day": 0, "start": 8, "end": 15},
    {"id": 3, "site": "eny",      "machine": "knuckle", "day": 0, "start": 7, "end": 15},
    {"id": 4, "site": "redhook",  "machine": "knuckle", "day": 1, "start": 7, "end": 16},
    {"id": 5, "site": "redhook",  "machine": "knuckle", "day": 2, "start": 7, "end": 16},
]

# ---------------------------------------------------------------- rules
CAUTION_FRACTION = 0.80     # caution from 80% of the limit
DISAGREE_MPH = 5            # sources further apart than this => low confidence
DEFAULT_ALPHA = 0.20        # wind-shear exponent when a source has no 80 m wind

def gust_at_height(h, height_ft):
    """Scale a 10 m gust to working height using the wind-shear power law."""
    hm = max(height_ft * 0.3048, 10.0)
    v10, v80 = h["wind10"], h.get("wind80")
    if v80 and v10 > 0 and v80 > v10:
        alpha = math.log(v80 / v10) / math.log(8.0)
    else:
        alpha = DEFAULT_ALPHA
    return h["gust10"] * (hm / 10.0) ** alpha

def state_for(gust, limit):
    if gust > limit:
        return "NO-GO"
    if gust >= CAUTION_FRACTION * limit:
        return "CAUTION"
    return "GO"

def evaluate(job, sources):
    """sources: {name: {hour: {wind10, gust10, wind80?}}} -> hourly verdicts, worst source wins."""
    m = MACHINES[job["machine"]]
    hours = []
    for hr in range(job["start"], job["end"]):
        gusts = [gust_at_height(s[hr], m["height_ft"]) for s in sources.values() if hr in s]
        worst = max(gusts)
        hours.append({"hour": hr, "gust": math.ceil(worst), "spread": round(max(gusts) - min(gusts)),
                      "state": state_for(worst, m["limit_mph"])})
    return hours

def windows(hours):
    out = []
    for h in hours:
        if out and out[-1]["state"] == h["state"]:
            out[-1]["end"] = h["hour"] + 1
            out[-1]["lo"] = min(out[-1]["lo"], h["gust"]); out[-1]["hi"] = max(out[-1]["hi"], h["gust"])
        else:
            out.append({"state": h["state"], "start": h["hour"], "end": h["hour"] + 1,
                        "lo": h["gust"], "hi": h["gust"]})
    return out

def day_verdict(hours):
    states = {h["state"] for h in hours}
    if states == {"GO"}: return "GO"
    if states == {"NO-GO"}: return "NO-GO"
    if "NO-GO" in states: return "PARTIAL"
    return "CAUTION"

def clock(h):
    return f"{(h - 1) % 12 + 1}{'am' if h < 12 or h == 24 else 'pm'}"

def message(job, hours, previous=None):
    s, m = SITES[job["site"]], MACHINES[job["machine"]]
    d = DAY1 + timedelta(days=job["day"])
    parts = []
    for w in windows(hours):
        rng = f"{w['lo']}" if w["lo"] == w["hi"] else f"{w['lo']}-{w['hi']}"
        parts.append(f"{w['state']} {clock(w['start'])}-{clock(w['end'])} (gusts {rng})")
    verdict = day_verdict(hours)
    head = f"{d:%a} {d.month}/{d.day} {s['name']}, {m['name']} limit {m['limit_mph']}mph at {m['height_ft']}ft."
    go_hrs = sum(h["state"] == "GO" for h in hours)
    flip = ""
    if previous and (previous[0] != verdict or abs(previous[1] - go_hrs) >= 2):
        flip = f"CHANGED since last night: was {previous[0]} with {previous[1]} GO hrs, now {go_hrs}. "
    conf = " Low confidence: forecasts disagree." if max(h["spread"] for h in hours) > DISAGREE_MPH else ""
    return (verdict, go_hrs), f"{flip}{head} " + ". ".join(parts) + f".{conf} Planning aid only; site reading governs."

# ---------------------------------------------------------------- forecasts
def fake_forecast(run):
    """Two made-up sources per (site, day). run = 'evening' or 'morning'."""
    def series(base, peak, front_hr, bias=0.0, shear=1.35):
        out = {}
        for hr in range(24):
            ramp = 1 / (1 + math.exp(-(hr - front_hr) * 1.2))        # front passage
            diurnal = 2.5 * math.sin((hr - 9) / 24 * 2 * math.pi)     # afternoon bump
            gust = base + (peak - base) * ramp + diurnal + bias
            wind = gust / 1.5
            out[hr] = {"wind10": max(wind, 1), "gust10": max(gust, 2), "wind80": max(wind, 1) * shear}
        return out
    front = 14 if run == "evening" else 10          # morning run: front arrives 4 hours early
    f = {
        ("redhook", 0):  {"A": series(9, 24, front),      "B": series(9, 22, front, bias=-1)},
        ("downtown", 0): {"A": series(8, 11, 13),         "B": series(8, 12, 13)},
        ("eny", 0):      {"A": series(13, 15, 12),        "B": series(13, 15, 12, bias=-7)},
        ("redhook", 1):  {"A": series(7, 9, 12),          "B": series(7, 10, 12)},
        ("redhook", 2):  {"A": series(24, 30, 9),         "B": series(23, 29, 9)},
    }
    for src in f.values():                             # B has no 80 m wind, like a 10 m-only feed
        for hr in src["B"]: src["B"][hr].pop("wind80")
    return f

def live_forecast():
    """Real Open-Meteo forecast, one source only for now. UNTESTED from the build sandbox."""
    out = {}
    for key, s in SITES.items():
        url = ("https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s"
               "&hourly=wind_speed_10m,wind_gusts_10m,wind_speed_80m&wind_speed_unit=mph"
               "&timezone=America%%2FNew_York&start_date=%s&end_date=%s"
               % (s["lat"], s["lon"], DAY1, DAY1 + timedelta(days=2)))
        h = json.load(urllib.request.urlopen(url, timeout=20))["hourly"]
        for i, t in enumerate(h["time"]):
            day = (date.fromisoformat(t[:10]) - DAY1).days
            out.setdefault((key, day), {"open-meteo": {}})["open-meteo"][int(t[11:13])] = {
                "wind10": h["wind_speed_10m"][i], "gust10": h["wind_gusts_10m"][i],
                "wind80": h["wind_speed_80m"][i]}
    return out

# ---------------------------------------------------------------- run
def run(label, forecast, previous=None):
    print(f"\n===== {label} =====")
    log, verdicts = [], {}
    for job in JOBS:
        hours = evaluate(job, forecast[(job["site"], job["day"])])
        verdict, text = message(job, hours, (previous or {}).get(job["id"]))
        verdicts[job["id"]] = verdict
        verdict = verdict[0]
        log.append({"run": label, "job": job["id"], "verdict": verdict, "hours": hours, "sms": text})
        print(f"\n[job {job['id']}] {verdict}  ({len(text)} chars)\n{text}")
    with open("runs.jsonl", "a") as fh:
        for row in log: fh.write(json.dumps(row) + "\n")
    return verdicts

if __name__ == "__main__":
    if "--live" in sys.argv:
        run("live", live_forecast())
    else:
        evening = run("6pm evening run (fake forecast)", fake_forecast("evening"))
        run("5:30am morning run (fake forecast, front arrives early)", fake_forecast("morning"), evening)
