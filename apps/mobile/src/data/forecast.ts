/**
 * One shape for a place's forecast, whether it came from live sources or from the sample scenarios.
 * Building it is pure; fetching lives in live.ts.
 */
import {
  alertsForDay,
  localKey,
  seriesForDay,
  sunTimes,
  worstReading,
  type HourReading,
  type OffsetFn,
  type OpenMeteoParsed,
  type ParsedAlert,
  type SourceForecast,
  type Sources,
} from '@windcheck/engine';
import { addDays, dayName } from './time';
import { SAMPLES, SAMPLE_DATE, SAMPLE_DAY_NAMES, SAMPLE_NOW_MINUTES, type PlaceId } from './samples';

export interface DayData {
  date: string;
  label: string;
  /** Per-source wind series. Empty means no source has this day: every hour is Unknown. */
  sources: Sources;
  /** Merged non-wind readings per local hour, worst case across sources. */
  readings: Partial<Record<number, HourReading>>;
  rainChancePct: number | null;
  rainAmountIn: number | null;
  alerts: ParsedAlert[];
  sun: { sunrise: number | null; sunset: number | null };
}

export interface PlaceForecast {
  kind: 'live' | 'sample';
  fetchedAt: number | null;
  now: { date: string; hour: number; minutes: number };
  days: DayData[];
  /** Merged readings for the current hour. */
  current: HourReading | null;
  sourceNames: string[];
  /** One line per source that failed, for the raw-data screen. */
  errors: string[];
  grid: string | null;
  timezone: string | null;
}

const DAYS_SHOWN = 4;

function dayFromReadings(readings: DayData['readings']) {
  const rs = Object.values(readings).filter((r): r is HourReading => !!r);
  const chances = rs.map((r) => r.rainChancePct).filter((x): x is number => x != null);
  const amounts = rs.map((r) => r.rainIn).filter((x): x is number => x != null);
  return {
    rainChancePct: chances.length ? Math.max(...chances) : null,
    rainAmountIn: amounts.length ? Math.round(amounts.reduce((a, b) => a + b, 0) * 100) / 100 : null,
  };
}

export interface LiveParts {
  openMeteo: OpenMeteoParsed | null;
  nws: SourceForecast | null;
  alerts: ParsedAlert[] | null;
  errors: string[];
  grid: string | null;
  timezone: string | null;
}

export function buildLiveForecast(parts: LiveParts, offset: OffsetFn, nowMs: number, lat: number, lon: number): PlaceForecast {
  const nowKey = localKey(nowMs, offset);
  const today = nowKey.slice(0, 10);
  const local = new Date(nowMs + offset(nowMs) * 60000);
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  const sources = [parts.openMeteo, parts.nws].filter((s): s is SourceForecast => !!s);

  const days: DayData[] = [];
  for (let i = 0; i < DAYS_SHOWN; i++) {
    const date = addDays(today, i);
    const daySources: Sources = {};
    for (const s of sources) {
      const series = seriesForDay(s, date);
      if (Object.keys(series).length) daySources[s.source] = series;
    }
    const readings: DayData['readings'] = {};
    for (let h = 0; h < 24; h++) {
      const key = `${date}T${String(h).padStart(2, '0')}`;
      const rs = sources.map((s) => s.hours[key]).filter(Boolean);
      if (rs.length) readings[h] = worstReading(rs);
    }
    const noon = Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), 12);
    const sun = parts.openMeteo?.sun[date] ?? sunTimes(date, lat, lon, offset(noon));
    days.push({
      date,
      label: i === 0 ? 'Today' : dayName(date),
      sources: daySources,
      readings,
      ...dayFromReadings(readings),
      alerts: parts.alerts ? alertsForDay(parts.alerts, date, offset) : [],
      sun,
    });
  }
  return {
    kind: 'live',
    fetchedAt: nowMs,
    now: { date: today, hour: Number(nowKey.slice(11, 13)), minutes },
    days,
    current: days[0]?.readings[Number(nowKey.slice(11, 13))] ?? null,
    sourceNames: sources.map((s) => s.source),
    errors: parts.errors,
    grid: parts.grid,
    timezone: parts.timezone,
  };
}

/** The design scenarios as a PlaceForecast. Every value is made up; the UI says so. */
export function buildSampleForecast(id: PlaceId, lat: number, lon: number): PlaceForecast {
  const sample = SAMPLES[id];
  const hour = Math.floor(SAMPLE_NOW_MINUTES / 60);
  const days: DayData[] = sample.days.map((d, i) => {
    const readings: DayData['readings'] = {};
    for (let h = 0; h < 24; h++) {
      readings[h] = {
        wind10: null, gust10: null, wind80: null,
        directionDeg: sample.current.directionDeg,
        tempF: d.tempF,
        feelsLikeF: i === 0 ? sample.current.feelsLikeF : null,
        humidityPct: i === 0 ? sample.current.humidityPct : null,
        dewPointF: i === 0 ? sample.current.dewPointF : null,
        rainChancePct: d.rain.rainChancePct,
        rainIn: null,
        thunderPct: d.stormsFromHour === undefined ? null : d.stormsFromHour !== null && h >= d.stormsFromHour ? 100 : 0,
        uvIndex: i === 0 ? sample.current.uvIndex : null,
        pressureInHg: i === 0 ? sample.current.pressureInHg : null,
      };
    }
    const date = addDays(SAMPLE_DATE, i);
    return {
      date,
      label: SAMPLE_DAY_NAMES[i] ?? dayName(date),
      sources: d.sources ?? {},
      readings,
      rainChancePct: d.rain.rainChancePct,
      rainAmountIn: d.rain.rainAmountIn,
      alerts: i === 0 ? sample.alerts.map((a) => ({ ...a, startsAt: null, endsAt: null })) : [],
      sun: sunTimes(date, lat, lon, -300),
    };
  });
  return {
    kind: 'sample',
    fetchedAt: null,
    now: { date: SAMPLE_DATE, hour, minutes: SAMPLE_NOW_MINUTES },
    days,
    current: days[0]!.readings[hour] ?? null,
    sourceNames: ['Sample data'],
    errors: [],
    grid: null,
    timezone: 'America/New_York',
  };
}
