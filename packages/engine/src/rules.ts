import type { DayVerdict, HourResult, HourState } from './types.ts';

const RANK: Record<HourState, number> = { GO: 0, CAUTION: 1, UNKNOWN: 2, 'NO-GO': 3 };

/** The worse of two hour states. UNKNOWN outranks GO and CAUTION so it is never hidden. */
export function worse(a: HourState, b: HourState): HourState {
  return RANK[b] > RANK[a] ? b : a;
}

/** Raise a state to at least CAUTION. NO-GO and UNKNOWN stay as they are. */
function atLeastCaution(s: HourState): HourState {
  return s === 'GO' ? 'CAUTION' : s;
}

export interface Alert {
  /** e.g. "Wind Advisory". */
  event: string;
  /** Whether the alert is wind related, so it forces caution (ENGINE.md section 7). */
  windRelated: boolean;
  /** Hours covered, local clock, end exclusive. Omit for the whole day. */
  startHour?: number;
  endHour?: number;
}

/** ENGINE.md section 7: an active wind alert forces every covered hour to at least CAUTION. */
export function applyAlerts(hours: HourResult[], alerts: Alert[]): HourResult[] {
  const wind = alerts.filter((a) => a.windRelated);
  if (wind.length === 0) return hours;
  return hours.map((h) => {
    const covered = wind.some((a) => (a.startHour ?? 0) <= h.hour && h.hour < (a.endHour ?? 24));
    return covered ? { ...h, state: atLeastCaution(h.state) } : h;
  });
}

/** Daily-level guard for section 7: an alert never sits on a "Go" day. */
export function alertDayVerdict(verdict: DayVerdict, alerts: Alert[]): DayVerdict {
  return verdict === 'GO' && alerts.some((a) => a.windRelated) ? 'CAUTION' : verdict;
}

export interface ExtraRules {
  /** No-go if storms are forecast. */
  lightning: boolean;
  /** Caution above a 50% chance. */
  rain: boolean;
  /** Caution below 32°F. */
  freezing: boolean;
}

export interface HourConditions {
  hour: number;
  /** Null when unknown. */
  stormsForecast: boolean | null;
  rainChancePct: number | null;
  tempF: number | null;
}

export const RAIN_CAUTION_PCT = 50;
export const FREEZING_F = 32;

/**
 * ENGINE.md section 9: optional per-activity rules. The worst state across all enabled rules wins.
 * When an enabled rule's input is unknown for an hour, that hour becomes UNKNOWN.
 */
export function applyExtraRules(hours: HourResult[], rules: ExtraRules, conditions: HourConditions[]): HourResult[] {
  if (!rules.lightning && !rules.rain && !rules.freezing) return hours;
  const byHour = new Map(conditions.map((c) => [c.hour, c]));
  return hours.map((h) => {
    const c = byHour.get(h.hour);
    let state = h.state;
    if (rules.lightning) {
      const v = c?.stormsForecast;
      state = worse(state, v == null ? 'UNKNOWN' : v ? 'NO-GO' : 'GO');
    }
    if (rules.rain) {
      const v = c?.rainChancePct;
      state = worse(state, v == null ? 'UNKNOWN' : v > RAIN_CAUTION_PCT ? 'CAUTION' : 'GO');
    }
    if (rules.freezing) {
      const v = c?.tempF;
      state = worse(state, v == null ? 'UNKNOWN' : v < FREEZING_F ? 'CAUTION' : 'GO');
    }
    return state === h.state ? h : { ...h, state };
  });
}
