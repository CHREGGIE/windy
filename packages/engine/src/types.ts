/** Internal units: mph, feet, degrees true. Hours are local clock hours 0–23 for the job's day. */

export type HourState = 'GO' | 'CAUTION' | 'NO-GO' | 'UNKNOWN';

/** PARTIAL is shown to people as "Go until 2 PM" (ENGINE.md section 5). */
export type DayVerdict = 'GO' | 'CAUTION' | 'NO-GO' | 'PARTIAL' | 'UNKNOWN';

/** One source's reading for one hour. Wind and gust are at 10 m. */
export interface SourceHour {
  wind10: number;
  gust10: number;
  /** Wind at 80 m, when the source has it. */
  wind80?: number | null;
}

/** One source's hourly series. A missing or null hour means the source has no data for it. */
export type SourceSeries = Partial<Record<number, SourceHour | null>>;

/** Every source for one place and day, keyed by source name. */
export type Sources = Record<string, SourceSeries>;

export interface Job {
  /** First working hour, inclusive. */
  startHour: number;
  /** Last working hour, exclusive. */
  endHour: number;
  limitMph: number;
  heightFt: number;
}

export interface SourceGust {
  source: string;
  gust10: number;
  wind10: number;
  alpha: number;
  factor: number;
  gustAtHeight: number;
}

export interface HourResult {
  hour: number;
  /** Worst gust at working height across sources, rounded up for display. Null when unknown. */
  gust: number | null;
  /** Unrounded worst gust at height. Null when unknown. */
  gustRaw: number | null;
  /** Max minus min gust at height across sources, rounded. 0 with a single source. */
  spread: number;
  state: HourState;
  /** Per-source derivation, for the raw-data screen. */
  sources: SourceGust[];
}

export interface Window {
  state: HourState;
  start: number;
  /** Exclusive. */
  end: number;
  lo: number | null;
  hi: number | null;
}
