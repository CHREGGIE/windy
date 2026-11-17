/**
 * SAMPLE DATA. Every number here is made up so the screens can be reviewed against the canvas.
 * Nothing in this file came from a forecast. The UI labels it as sample wherever it is shown.
 * Milestone 1 replaces this module with the NWS and Open-Meteo adapters.
 */
import { fakeForecast, fakeSeries, type Alert, type Sources } from '@windcheck/engine';

export type PlaceId = 'redhook' | 'downtown' | 'eny';

export interface Place {
  id: PlaceId;
  /** Short name for the pill, e.g. "Red Hook". */
  short: string;
  name: string;
  lat: number;
  lon: number;
  /** UTC offset on the sample date. Real places will carry an IANA time zone. */
  utcOffsetMinutes: number;
}

export const PLACES: Place[] = [
  { id: 'redhook', short: 'Red Hook', name: 'Red Hook yard', lat: 40.675, lon: -74.012, utcOffsetMinutes: -300 },
  { id: 'downtown', short: 'Downtown', name: 'Downtown Bklyn', lat: 40.692, lon: -73.985, utcOffsetMinutes: -300 },
  { id: 'eny', short: 'East New York', name: 'East New York lot', lat: 40.666, lon: -73.882, utcOffsetMinutes: -300 },
];

export function place(id: PlaceId): Place {
  return PLACES.find((p) => p.id === id) ?? PLACES[0]!;
}

/** The sample clock: Tuesday 17 November 2026, 1:00 PM local. */
export const SAMPLE_DATE = '2026-11-17';
export const SAMPLE_DAY_NAMES = ['Today', 'Wed', 'Thu', 'Fri'] as const;
export const SAMPLE_NOW_MINUTES = 13 * 60;

export interface DayConditions {
  /** Percent, or null when unknown. */
  rainChancePct: number | null;
  rainAmountIn: number | null;
}

export interface SampleDay {
  /** Null when no source has this day: the UI shows Unknown, never a guess. */
  sources: Sources | null;
  rain: DayConditions;
  /** Hour storms become possible, or null for none forecast. Undefined means unknown. */
  stormsFromHour: number | null | undefined;
  tempF: number | null;
}

export interface SampleCurrent {
  directionDeg: number;
  humidityPct: number;
  uvIndex: number;
  tempF: number;
  feelsLikeF: number;
  dewPointF: number;
  pressureInHg: number;
}

export interface SamplePlace {
  current: SampleCurrent;
  /** Four days starting today. */
  days: SampleDay[];
  alerts: (Alert & { detail: string })[];
}

const evening = fakeForecast('evening');

const unknownDay: SampleDay = {
  sources: null,
  rain: { rainChancePct: null, rainAmountIn: null },
  stormsFromHour: undefined,
  tempF: null,
};

export const SAMPLES: Record<PlaceId, SamplePlace> = {
  // The prototype's fake job 1, 4 and 5 forecasts: go until 2 PM today, calm Wednesday, windy Thursday.
  redhook: {
    current: { directionDeg: 225, humidityPct: 62, uvIndex: 2, tempF: 46, feelsLikeF: 41, dewPointF: 34, pressureInHg: 30.12 },
    days: [
      { sources: evening['redhook:0']!, rain: { rainChancePct: 10, rainAmountIn: 0 }, stormsFromHour: null, tempF: 46 },
      { sources: evening['redhook:1']!, rain: { rainChancePct: 20, rainAmountIn: 0.05 }, stormsFromHour: null, tempF: 44 },
      { sources: evening['redhook:2']!, rain: { rainChancePct: 60, rainAmountIn: 0.4 }, stormsFromHour: 16, tempF: 39 },
      unknownDay,
    ],
    alerts: [],
  },
  // Over the crane limit all day.
  downtown: {
    current: { directionDeg: 315, humidityPct: 48, uvIndex: 1, tempF: 39, feelsLikeF: 30, dewPointF: 21, pressureInHg: 29.84 },
    days: [
      {
        sources: { A: fakeSeries(24, 30, 9), B: fakeSeries(23, 29, 9, 0, null) },
        rain: { rainChancePct: 60, rainAmountIn: 0.4 },
        stormsFromHour: 16,
        tempF: 39,
      },
      { sources: null, rain: { rainChancePct: 30, rainAmountIn: 0.1 }, stormsFromHour: undefined, tempF: null },
      { sources: null, rain: { rainChancePct: 10, rainAmountIn: 0 }, stormsFromHour: undefined, tempF: null },
      unknownDay,
    ],
    alerts: [],
  },
  // Near the roofing limit all afternoon, with a wind advisory.
  eny: {
    current: { directionDeg: 300, humidityPct: 55, uvIndex: 2, tempF: 41, feelsLikeF: 35, dewPointF: 26, pressureInHg: 30.02 },
    days: [
      {
        sources: { A: fakeSeries(9, 16.5, 11), B: fakeSeries(9, 16, 11, -1, null) },
        rain: { rainChancePct: 20, rainAmountIn: 0.05 },
        stormsFromHour: null,
        tempF: 41,
      },
      { sources: null, rain: { rainChancePct: 20, rainAmountIn: 0.05 }, stormsFromHour: undefined, tempF: null },
      { sources: null, rain: { rainChancePct: 60, rainAmountIn: 0.4 }, stormsFromHour: undefined, tempF: null },
      unknownDay,
    ],
    alerts: [
      {
        event: 'Wind Advisory',
        windRelated: true,
        endHour: 18,
        detail: 'Until 6 PM today. Gusts may rise quickly this afternoon.',
      },
    ],
  },
};
