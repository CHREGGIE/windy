import type { DayVerdict, HourResult, HourState, Job, SourceGust, SourceHour, Sources, Window } from './types.ts';

/** Caution starts at this fraction of the user's limit. */
export const CAUTION_FRACTION = 0.8;
/** Sources further apart than this, in mph, in any working hour mark the job low confidence. */
export const DISAGREE_MPH = 5;
/** Wind-shear exponent when a source has no usable 80 m wind. */
export const DEFAULT_ALPHA = 0.2;

const FT_TO_M = 0.3048;

/** ENGINE.md section 2: scale the 10 m gust to working height with the power law. */
export function gustAtHeight(h: SourceHour, heightFt: number): { gust: number; alpha: number; factor: number } {
  const hm = Math.max(heightFt * FT_TO_M, 10);
  const v10 = h.wind10;
  const v80 = h.wind80;
  const alpha = v80 != null && v10 > 0 && v80 > v10 ? Math.log(v80 / v10) / Math.log(8) : DEFAULT_ALPHA;
  const factor = (hm / 10) ** alpha;
  return { gust: h.gust10 * factor, alpha, factor };
}

/** ENGINE.md section 4. */
export function stateFor(gust: number, limitMph: number): Exclude<HourState, 'UNKNOWN'> {
  if (gust > limitMph) return 'NO-GO';
  if (gust >= CAUTION_FRACTION * limitMph) return 'CAUTION';
  return 'GO';
}

/** Python's round(): half to even. Kept so spreads match the prototype exactly. */
function roundHalfEven(x: number): number {
  const r = Math.round(x);
  return Math.abs(x % 1) === 0.5 && r % 2 !== 0 ? r - 1 : r;
}

/**
 * ENGINE.md sections 3, 4 and 8. For each working hour, the worst gust at height across sources.
 * An hour no source covers is UNKNOWN; it is never filled from a neighbour.
 */
export function evaluate(job: Job, sources: Sources): HourResult[] {
  const out: HourResult[] = [];
  for (let hour = job.startHour; hour < job.endHour; hour++) {
    const perSource: SourceGust[] = [];
    for (const [source, series] of Object.entries(sources)) {
      const h = series[hour];
      if (!h || !Number.isFinite(h.gust10) || !Number.isFinite(h.wind10)) continue;
      const { gust, alpha, factor } = gustAtHeight(h, job.heightFt);
      perSource.push({ source, gust10: h.gust10, wind10: h.wind10, alpha, factor, gustAtHeight: gust });
    }
    if (perSource.length === 0) {
      out.push({ hour, gust: null, gustRaw: null, spread: 0, state: 'UNKNOWN', sources: [] });
      continue;
    }
    const gusts = perSource.map((s) => s.gustAtHeight);
    const worst = Math.max(...gusts);
    out.push({
      hour,
      gust: Math.ceil(worst),
      gustRaw: worst,
      spread: roundHalfEven(worst - Math.min(...gusts)),
      state: stateFor(worst, job.limitMph),
      sources: perSource,
    });
  }
  return out;
}

/** ENGINE.md section 5: merge consecutive hours with the same state. */
export function windows(hours: HourResult[]): Window[] {
  const out: Window[] = [];
  for (const h of hours) {
    const last = out[out.length - 1];
    if (last && last.state === h.state && last.end === h.hour) {
      last.end = h.hour + 1;
      if (h.gust != null) {
        last.lo = last.lo == null ? h.gust : Math.min(last.lo, h.gust);
        last.hi = last.hi == null ? h.gust : Math.max(last.hi, h.gust);
      }
    } else {
      out.push({ state: h.state, start: h.hour, end: h.hour + 1, lo: h.gust, hi: h.gust });
    }
  }
  return out;
}

/**
 * ENGINE.md section 5, extended for section 8. Unknown hours never count as GO:
 * a day with unknown hours and no NO-GO hour is UNKNOWN.
 */
export function dayVerdict(hours: HourResult[]): DayVerdict {
  const states = new Set(hours.map((h) => h.state));
  if (states.size === 0) return 'UNKNOWN';
  if (states.size === 1 && states.has('GO')) return 'GO';
  if (states.size === 1 && states.has('NO-GO')) return 'NO-GO';
  if (states.has('NO-GO')) return 'PARTIAL';
  if (states.has('UNKNOWN')) return 'UNKNOWN';
  return 'CAUTION';
}

export function goHours(hours: HourResult[]): number {
  return hours.filter((h) => h.state === 'GO').length;
}

/** ENGINE.md section 3: sources disagree by more than 5 mph in any working hour. */
export function lowConfidence(hours: HourResult[]): boolean {
  return hours.some((h) => h.spread > DISAGREE_MPH);
}

export interface RunSummary {
  verdict: DayVerdict;
  goHours: number;
}

export function summarize(hours: HourResult[]): RunSummary {
  return { verdict: dayVerdict(hours), goHours: goHours(hours) };
}

/** ENGINE.md section 6: the daily verdict differs, or GO hours differ by two or more. */
export function shouldSendChange(previous: RunSummary | null | undefined, current: RunSummary): boolean {
  if (!previous) return false;
  return previous.verdict !== current.verdict || Math.abs(previous.goHours - current.goHours) >= 2;
}
