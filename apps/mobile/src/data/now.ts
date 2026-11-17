import {
  THUNDER_POSSIBLE_PCT,
  alertDayVerdict,
  applyAlerts,
  applyExtraRules,
  compassPoint,
  dayVerdict,
  evaluate,
  lowConfidence,
  windows,
  type DayVerdict,
  type HourConditions,
  type HourResult,
  type HourState,
  type ParsedAlert,
  type SourceGust,
} from '@windcheck/engine';
import { activity, type ActivityDef, type ActivityId } from './catalog';
import type { DayData, PlaceForecast } from './forecast';
import type { SavedPlace } from './places';
import type { ActivitySettings } from '@/state/AppState';
import { hourLabel, verdictWord } from '@/format';

export interface DayForecast {
  date: string;
  label: string;
  verdict: DayVerdict;
  /** Working hours only. */
  hours: HourResult[];
  rainChancePct: number | null;
  rainAmountIn: number | null;
  peak: HourResult | null;
}

export interface NowModel {
  activity: ActivityDef;
  place: SavedPlace;
  settings: ActivitySettings;
  forecast: PlaceForecast;
  isSample: boolean;
  nowHour: number;
  /** Today's working hours, after alerts and extra rules. */
  hours: HourResult[];
  /** The current clock hour, evaluated even outside working hours. */
  current: HourResult | null;
  state: HourState;
  steadyMph: number | null;
  line: string;
  verdict: DayVerdict;
  lowConfidence: boolean;
  peak: HourResult | null;
  direction: { deg: number; abbr: string; name: string } | null;
  worst: SourceGust | null;
  days: DayForecast[];
  sun: { sunrise: number | null; sunset: number | null; nowMinutes: number };
  lightning: { state: 'none' | 'possible' | 'unknown'; detail: string };
  alerts: { event: string; detail: string }[];
}

function conditionsFor(day: DayData): HourConditions[] {
  const out: HourConditions[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const r = day.readings[hour];
    out.push({
      hour,
      stormsForecast: r?.thunderPct == null ? null : r.thunderPct >= THUNDER_POSSIBLE_PCT,
      rainChancePct: r?.rainChancePct ?? null,
      tempF: r?.tempF ?? null,
    });
  }
  return out;
}

function evaluateDay(day: DayData, start: number, end: number, s: ActivitySettings, alerts: ParsedAlert[]): HourResult[] {
  const raw = evaluate({ startHour: start, endHour: end, limitMph: s.limitMph, heightFt: s.heightFt }, day.sources);
  return applyAlerts(applyExtraRules(raw, s.rules, conditionsFor(day)), alerts);
}

function peakOf(hours: HourResult[]): HourResult | null {
  let best: HourResult | null = null;
  for (const h of hours) if (h.gust != null && (best?.gust == null || h.gust > best.gust)) best = h;
  return best;
}

/** A day's verdict in words. PARTIAL reads "Go until 2 PM" (ENGINE.md section 5). */
export function dayVerdictLabel(d: Pick<DayForecast, 'verdict' | 'hours'>): string {
  if (d.verdict !== 'PARTIAL') return verdictWord(d.verdict);
  const ws = windows(d.hours);
  if (ws[0]?.state === 'GO') return `Go until ${hourLabel(ws[0].end)}`;
  const go = ws.find((w) => w.state === 'GO');
  return go ? `Go from ${hourLabel(go.start)}` : 'No-go part of the day';
}

/** One line of plain language under the verdict word, e.g. "Clear to lift until 2 PM". */
export function heroLine(hours: HourResult[], nowHour: number, a: ActivityDef, today: DayForecast, tomorrow?: DayForecast): string {
  if (nowHour < a.workStart) return `Work starts at ${hourLabel(a.workStart)}. Today: ${dayVerdictLabel(today).toLowerCase()}`;
  if (nowHour >= a.workEnd) return tomorrow ? `Done for today. Tomorrow: ${dayVerdictLabel(tomorrow).toLowerCase()}` : 'Done for today';
  const ws = windows(hours);
  const w = ws.find((x) => x.start <= nowHour && nowHour < x.end);
  if (!w) return 'No forecast for this hour. Check on site.';
  const toEnd = w.end >= a.workEnd;
  const wholeDay = w.start <= a.workStart && toEnd;
  const span = wholeDay ? 'all day' : toEnd ? (nowHour >= 12 ? 'all afternoon' : 'for the rest of the day') : `until ${hourLabel(w.end)}`;
  switch (w.state) {
    case 'GO':
      return `Clear to ${a.verb} ${span}`;
    case 'CAUTION':
      return `Near your limit ${span}`;
    case 'NO-GO':
      return `Over your limit ${span}`;
    default:
      return `No forecast ${span}. Check on site.`;
  }
}

function lightningFor(day: DayData | undefined, nowHour: number): NowModel['lightning'] {
  if (!day) return { state: 'unknown', detail: 'No storm forecast available' };
  const hours = Object.entries(day.readings)
    .map(([h, r]) => ({ h: Number(h), t: r?.thunderPct ?? null }))
    .filter((x) => x.h >= nowHour);
  if (hours.length === 0 || hours.every((x) => x.t == null)) return { state: 'unknown', detail: 'No storm forecast available' };
  const first = hours.find((x) => x.t != null && x.t >= THUNDER_POSSIBLE_PCT);
  if (!first) return { state: 'none', detail: 'No storms forecast today' };
  return { state: 'possible', detail: first.h <= nowHour ? 'Storms possible now' : `Storms possible after ${hourLabel(first.h)}` };
}

export function buildNow(activityId: ActivityId, place: SavedPlace, settings: ActivitySettings, f: PlaceForecast): NowModel {
  const a = activity(activityId);
  const nowHour = f.now.hour;

  const days: DayForecast[] = f.days.map((d) => {
    const hours = evaluateDay(d, a.workStart, a.workEnd, settings, d.alerts);
    return {
      date: d.date,
      label: d.label,
      verdict: alertDayVerdict(dayVerdict(hours), d.alerts),
      hours,
      rainChancePct: d.rainChancePct,
      rainAmountIn: d.rainAmountIn,
      peak: peakOf(hours),
    };
  });
  const today = days[0]!;
  const todayData = f.days[0]!;
  const allToday = evaluateDay(todayData, 0, 24, settings, todayData.alerts);
  const current = allToday.find((h) => h.hour === nowHour) ?? null;
  const worst = current?.sources.reduce<SourceGust | null>((m, s) => (m == null || s.gustAtHeight > m.gustAtHeight ? s : m), null) ?? null;
  const steady = current?.sources.length ? Math.max(...current.sources.map((s) => s.wind10 * s.factor)) : null;
  const deg = f.current?.directionDeg;

  return {
    activity: a,
    place,
    settings,
    forecast: f,
    isSample: f.kind === 'sample',
    nowHour,
    hours: today.hours,
    current,
    state: current?.state ?? 'UNKNOWN',
    steadyMph: steady,
    line: heroLine(today.hours, nowHour, a, today, days[1]),
    verdict: today.verdict,
    lowConfidence: lowConfidence(today.hours),
    peak: today.peak,
    direction: deg == null ? null : { deg: Math.round(deg), ...compassPoint(deg) },
    worst,
    days,
    sun: { ...todayData.sun, nowMinutes: f.now.minutes },
    lightning: lightningFor(todayData, nowHour),
    alerts: todayData.alerts.filter((x) => x.endsAt == null || x.endsAt > (f.fetchedAt ?? 0)).map((x) => ({ event: x.event, detail: x.detail })),
  };
}
