import {
  alertDayVerdict,
  applyAlerts,
  applyExtraRules,
  compassPoint,
  dayVerdict,
  evaluate,
  lowConfidence,
  sunTimes,
  windows,
  type DayVerdict,
  type HourConditions,
  type HourResult,
  type HourState,
  type Job,
  type SourceGust,
} from '@windcheck/engine';
import { activity, type ActivityDef, type ActivityId } from './catalog';
import { place, SAMPLE_DATE, SAMPLE_DAY_NAMES, SAMPLE_NOW_MINUTES, SAMPLES, type Place, type PlaceId, type SampleDay } from './samples';
import type { ActivitySettings } from '@/state/AppState';
import { hourLabel, verdictWord } from '@/format';

export interface DayForecast {
  label: string;
  verdict: DayVerdict;
  hours: HourResult[];
  rainChancePct: number | null;
  rainAmountIn: number | null;
  peak: HourResult | null;
}

export interface NowModel {
  activity: ActivityDef;
  place: Place;
  settings: ActivitySettings;
  /** Every number on screen comes from sample data until milestone 1. */
  isSample: true;
  nowHour: number;
  hours: HourResult[];
  current: HourResult | null;
  /** State of the hero: the current hour, after alerts and extra rules. */
  state: HourState;
  steadyMph: number | null;
  line: string;
  verdict: DayVerdict;
  lowConfidence: boolean;
  peak: HourResult | null;
  direction: { deg: number; abbr: string; name: string };
  current10m: SampleCurrentReadings;
  days: DayForecast[];
  sun: { sunrise: number | null; sunset: number | null; nowMinutes: number };
  lightning: { state: 'none' | 'possible' | 'unknown'; detail: string };
  alerts: { event: string; detail: string }[];
}

export interface SampleCurrentReadings {
  humidityPct: number;
  uvIndex: number;
  tempF: number;
  feelsLikeF: number;
  dewPointF: number;
  pressureInHg: number;
  /** The source that set the hero number, with its derivation. */
  worst: SourceGust | null;
  sourceCount: number;
}

function job(a: ActivityDef, s: ActivitySettings): Job {
  return { startHour: a.workStart, endHour: a.workEnd, limitMph: s.limitMph, heightFt: s.heightFt };
}

function conditionsFor(day: SampleDay, a: ActivityDef): HourConditions[] {
  const out: HourConditions[] = [];
  for (let hour = a.workStart; hour < a.workEnd; hour++) {
    out.push({
      hour,
      stormsForecast: day.stormsFromHour === undefined ? null : day.stormsFromHour !== null && hour >= day.stormsFromHour,
      rainChancePct: day.rain.rainChancePct,
      tempF: day.tempF,
    });
  }
  return out;
}

function evaluateDay(day: SampleDay, a: ActivityDef, s: ActivitySettings, alerts: SampleAlerts): HourResult[] {
  const raw = evaluate(job(a, s), day.sources ?? {});
  return applyAlerts(applyExtraRules(raw, s.rules, conditionsFor(day, a)), alerts);
}

type SampleAlerts = (typeof SAMPLES)[PlaceId]['alerts'];

function peakOf(hours: HourResult[]): HourResult | null {
  let best: HourResult | null = null;
  for (const h of hours) if (h.gust != null && (best?.gust == null || h.gust > best.gust)) best = h;
  return best;
}

/** One line of plain language under the verdict word, e.g. "Clear to lift until 2 PM". */
export function heroLine(hours: HourResult[], nowHour: number, a: ActivityDef): string {
  const ws = windows(hours);
  const i = ws.findIndex((w) => w.start <= nowHour && nowHour < w.end);
  const w = ws[i];
  if (!w) return nowHour < a.workStart ? `Work starts at ${hourLabel(a.workStart)}` : 'Outside your working hours';
  const toEnd = w.end >= a.workEnd;
  const wholeDay = w.start <= a.workStart && toEnd;
  const span = wholeDay ? 'all day' : toEnd ? (nowHour >= 12 ? 'all afternoon' : 'for the rest of the day') : `until ${hourLabel(w.end)}`;
  switch (w.state) {
    case 'GO':
      return wholeDay ? `Clear to ${a.verb} all day` : `Clear to ${a.verb} ${span}`;
    case 'CAUTION':
      return `Near your limit ${span}`;
    case 'NO-GO':
      return `Over your limit ${span}`;
    default:
      return `No forecast ${span}. Check on site.`;
  }
}

/** A day's verdict in words. PARTIAL reads "Go until 2 PM" (ENGINE.md section 5). */
export function dayVerdictLabel(d: DayForecast): string {
  if (d.verdict !== 'PARTIAL') return verdictWord(d.verdict);
  const first = windows(d.hours)[0];
  if (first?.state === 'GO') return `Go until ${hourLabel(first.end)}`;
  const go = windows(d.hours).find((w) => w.state === 'GO');
  return go ? `Go from ${hourLabel(go.start)}` : 'No-go part of the day';
}

function lightningFor(day: SampleDay | undefined): NowModel['lightning'] {
  if (!day || day.stormsFromHour === undefined) return { state: 'unknown', detail: 'No storm forecast available' };
  if (day.stormsFromHour === null) return { state: 'none', detail: 'No storms forecast today' };
  return { state: 'possible', detail: `Storms possible after ${hourLabel(day.stormsFromHour)}` };
}

export function buildNow(activityId: ActivityId, placeId: PlaceId, settings: ActivitySettings): NowModel {
  const a = activity(activityId);
  const p = place(placeId);
  const sample = SAMPLES[placeId];
  const nowHour = Math.floor(SAMPLE_NOW_MINUTES / 60);
  const today = sample.days[0]!;

  const days: DayForecast[] = sample.days.map((d, i) => {
    const hours = evaluateDay(d, a, settings, i === 0 ? sample.alerts : []);
    const v = dayVerdict(hours);
    return {
      label: SAMPLE_DAY_NAMES[i] ?? `Day ${i + 1}`,
      verdict: i === 0 ? alertDayVerdict(v, sample.alerts) : v,
      hours,
      rainChancePct: d.rain.rainChancePct,
      rainAmountIn: d.rain.rainAmountIn,
      peak: peakOf(hours),
    };
  });
  const hours = days[0]!.hours;
  const current = hours.find((h) => h.hour === nowHour) ?? null;
  const worst = current?.sources.reduce<SourceGust | null>((m, s) => (m == null || s.gustAtHeight > m.gustAtHeight ? s : m), null) ?? null;
  const steady = current?.sources.length ? Math.max(...current.sources.map((s) => s.wind10 * s.factor)) : null;
  const dir = compassPoint(sample.current.directionDeg);

  return {
    activity: a,
    place: p,
    settings,
    isSample: true,
    nowHour,
    hours,
    current,
    state: current?.state ?? 'UNKNOWN',
    steadyMph: steady,
    line: heroLine(hours, nowHour, a),
    verdict: days[0]!.verdict,
    lowConfidence: lowConfidence(hours),
    peak: peakOf(hours),
    direction: { deg: sample.current.directionDeg, ...dir },
    current10m: { ...sample.current, worst, sourceCount: current?.sources.length ?? 0 },
    days,
    sun: { ...sunTimes(SAMPLE_DATE, p.lat, p.lon, p.utcOffsetMinutes), nowMinutes: SAMPLE_NOW_MINUTES },
    lightning: lightningFor(today),
    alerts: sample.alerts.map((x) => ({ event: x.event, detail: x.detail })),
  };
}
