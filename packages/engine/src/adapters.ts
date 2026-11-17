/**
 * Adapters: raw API responses in, engine inputs out. Pure: no network, no clock.
 * Field names and units confirmed against saved responses in test/fixtures (17 Nov 2026).
 *
 * All hours are keyed by the PLACE's local clock: `YYYY-MM-DDTHH`.
 */
import type { Alert } from './rules.ts';
import type { SourceHour, SourceSeries } from './types.ts';

export interface HourReading {
  wind10: number | null;
  gust10: number | null;
  wind80: number | null;
  directionDeg: number | null;
  tempF: number | null;
  feelsLikeF: number | null;
  humidityPct: number | null;
  dewPointF: number | null;
  rainChancePct: number | null;
  /** Rain amount in this hour, inches. */
  rainIn: number | null;
  /** Chance of thunder, percent. */
  thunderPct: number | null;
  uvIndex: number | null;
  pressureInHg: number | null;
}

export interface SourceForecast {
  source: string;
  /** Keyed by local hour, `YYYY-MM-DDTHH`. */
  hours: Record<string, HourReading>;
}

/** Converts a UTC instant to the place's UTC offset in minutes. Lets callers handle DST. */
export type OffsetFn = (utcMs: number) => number;

const KMH_TO_MPH = 0.621371;
const MM_TO_IN = 1 / 25.4;
const HPA_TO_INHG = 0.0295300;
const cToF = (c: number) => (c * 9) / 5 + 32;

function emptyReading(): HourReading {
  return {
    wind10: null, gust10: null, wind80: null, directionDeg: null, tempF: null, feelsLikeF: null, humidityPct: null,
    dewPointF: null, rainChancePct: null, rainIn: null, thunderPct: null, uvIndex: null, pressureInHg: null,
  };
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function localKey(utcMs: number, offset: OffsetFn): string {
  const d = new Date(utcMs + offset(utcMs) * 60000);
  return d.toISOString().slice(0, 13);
}

/** WMO weather codes 95, 96 and 99 are thunderstorms. */
const THUNDER_CODES = new Set([95, 96, 99]);

/* ------------------------------------------------------------------ Open-Meteo */

export interface OpenMeteoParsed extends SourceForecast {
  timezone: string;
  utcOffsetSeconds: number;
  /** Local date -> sunrise and sunset, minutes after local midnight. */
  sun: Record<string, { sunrise: number | null; sunset: number | null }>;
}

/**
 * Expects the request made by the app: hourly wind_speed_10m, wind_gusts_10m, wind_speed_80m,
 * wind_direction_10m, temperature_2m, apparent_temperature, relative_humidity_2m, dew_point_2m,
 * precipitation_probability, precipitation, weather_code, uv_index, pressure_msl;
 * wind_speed_unit=mph, temperature_unit=fahrenheit, precipitation_unit=inch, timezone=auto.
 */
export function parseOpenMeteo(json: any): OpenMeteoParsed {
  const h = json?.hourly;
  if (!h || !Array.isArray(h.time)) throw new Error('Open-Meteo: no hourly data');
  const units = json.hourly_units ?? {};
  if (units.wind_speed_10m && !/mp\/?h/.test(units.wind_speed_10m)) throw new Error(`Open-Meteo: unexpected wind unit ${units.wind_speed_10m}`);
  if (units.temperature_2m && units.temperature_2m !== '°F') throw new Error(`Open-Meteo: unexpected temperature unit ${units.temperature_2m}`);
  const at = (k: string, i: number) => num(h[k]?.[i]);
  const hours: Record<string, HourReading> = {};
  h.time.forEach((t: string, i: number) => {
    const code = at('weather_code', i);
    const pressure = at('pressure_msl', i);
    hours[t.slice(0, 13)] = {
      wind10: at('wind_speed_10m', i),
      gust10: at('wind_gusts_10m', i),
      wind80: at('wind_speed_80m', i),
      directionDeg: at('wind_direction_10m', i),
      tempF: at('temperature_2m', i),
      feelsLikeF: at('apparent_temperature', i),
      humidityPct: at('relative_humidity_2m', i),
      dewPointF: at('dew_point_2m', i),
      rainChancePct: at('precipitation_probability', i),
      rainIn: at('precipitation', i),
      // Open-Meteo has no thunder probability: a thunderstorm weather code counts as 100, otherwise unknown-free 0.
      thunderPct: code == null ? null : THUNDER_CODES.has(code) ? 100 : 0,
      uvIndex: at('uv_index', i),
      pressureInHg: pressure == null ? null : pressure * HPA_TO_INHG,
    };
  });
  const sun: OpenMeteoParsed['sun'] = {};
  const d = json.daily;
  const minutes = (s: unknown) => (typeof s === 'string' && s.length >= 16 ? Number(s.slice(11, 13)) * 60 + Number(s.slice(14, 16)) : null);
  if (d && Array.isArray(d.time)) {
    d.time.forEach((date: string, i: number) => {
      sun[date] = { sunrise: minutes(d.sunrise?.[i]), sunset: minutes(d.sunset?.[i]) };
    });
  }
  return { source: 'Open-Meteo', hours, timezone: String(json.timezone ?? ''), utcOffsetSeconds: Number(json.utc_offset_seconds ?? 0), sun };
}

/* ------------------------------------------------------------------ NWS */

export interface NwsPoint {
  gridId: string;
  gridX: number;
  gridY: number;
  forecastGridData: string;
  timeZone: string;
  city: string | null;
  state: string | null;
}

export function parseNwsPoint(json: any): NwsPoint {
  const p = json?.properties;
  if (!p?.forecastGridData) throw new Error('NWS: point has no grid');
  const rel = p.relativeLocation?.properties;
  return {
    gridId: String(p.gridId),
    gridX: Number(p.gridX),
    gridY: Number(p.gridY),
    forecastGridData: String(p.forecastGridData),
    timeZone: String(p.timeZone ?? ''),
    city: rel?.city ?? null,
    state: rel?.state ?? null,
  };
}

/** ISO 8601 duration as used by NWS validTime ("PT2H", "P1DT6H") in hours. */
export function isoDurationHours(d: string): number {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/.exec(d);
  if (!m) throw new Error(`NWS: bad duration ${d}`);
  return Number(m[1] ?? 0) * 24 + Number(m[2] ?? 0) + Number(m[3] ?? 0) / 60;
}

type Layer = { uom?: string; values?: { validTime: string; value: number | null }[] };

/** Spread NWS "start/duration" values onto each UTC hour they cover. */
function expand(layer: Layer | undefined, convert: (v: number) => number): Map<number, number> {
  const out = new Map<number, number>();
  for (const { validTime, value } of layer?.values ?? []) {
    if (value == null) continue;
    const [start, dur] = validTime.split('/');
    const t0 = Date.parse(start!);
    const hours = Math.max(1, Math.round(isoDurationHours(dur!)));
    for (let k = 0; k < hours; k++) out.set(t0 + k * 3600000, convert(value));
  }
  return out;
}

function speedConverter(uom: string | undefined): (v: number) => number {
  if (uom === 'wmoUnit:km_h-1') return (v) => v * KMH_TO_MPH;
  if (uom === 'wmoUnit:m_s-1') return (v) => v * 2.236936;
  if (uom === 'wmoUnit:kn') return (v) => v * 1.150779;
  throw new Error(`NWS: unexpected speed unit ${uom}`);
}

function tempConverter(uom: string | undefined): (v: number) => number {
  if (uom === 'wmoUnit:degC') return cToF;
  if (uom === 'wmoUnit:degF') return (v) => v;
  throw new Error(`NWS: unexpected temperature unit ${uom}`);
}

/**
 * NWS gridpoint data (`/gridpoints/{office}/{x},{y}`). Speeds arrive in km/h, temperatures in °C and
 * precipitation in mm over multi-hour intervals; this converts to mph, °F and inches per hour.
 * Precipitation over an interval is divided evenly across its hours.
 */
export function parseNwsGrid(json: any, offset: OffsetFn): SourceForecast {
  const p = json?.properties;
  if (!p) throw new Error('NWS: no gridpoint properties');
  const wind = expand(p.windSpeed, speedConverter(p.windSpeed?.uom));
  const gust = expand(p.windGust, speedConverter(p.windGust?.uom ?? p.windSpeed?.uom));
  const dir = expand(p.windDirection, (v) => v);
  const temp = expand(p.temperature, tempConverter(p.temperature?.uom));
  const feels = expand(p.apparentTemperature, tempConverter(p.apparentTemperature?.uom));
  const rh = expand(p.relativeHumidity, (v) => v);
  const dew = expand(p.dewpoint, tempConverter(p.dewpoint?.uom));
  const pop = expand(p.probabilityOfPrecipitation, (v) => v);
  const thunder = expand(p.probabilityOfThunder, (v) => v);
  const qpf = new Map<number, number>();
  for (const { validTime, value } of (p.quantitativePrecipitation as Layer | undefined)?.values ?? []) {
    if (value == null) continue;
    const [start, dur] = validTime.split('/');
    const n = Math.max(1, Math.round(isoDurationHours(dur!)));
    for (let k = 0; k < n; k++) qpf.set(Date.parse(start!) + k * 3600000, (value * MM_TO_IN) / n);
  }

  const hours: Record<string, HourReading> = {};
  const allTimes = new Set<number>([...wind.keys(), ...gust.keys(), ...temp.keys()]);
  for (const t of [...allTimes].sort((a, b) => a - b)) {
    hours[localKey(t, offset)] = {
      ...emptyReading(),
      wind10: wind.get(t) ?? null,
      gust10: gust.get(t) ?? null,
      directionDeg: dir.get(t) ?? null,
      tempF: temp.get(t) ?? null,
      feelsLikeF: feels.get(t) ?? null,
      humidityPct: rh.get(t) ?? null,
      dewPointF: dew.get(t) ?? null,
      rainChancePct: pop.get(t) ?? null,
      rainIn: qpf.get(t) ?? null,
      thunderPct: thunder.get(t) ?? null,
    };
  }
  return { source: 'NWS', hours };
}

/** Alert events that are about wind, so they force at least caution (ENGINE.md section 7). */
const WIND_EVENTS = [
  'wind', 'gale', 'small craft', 'storm warning', 'hurricane', 'tropical storm', 'tornado',
  'severe thunderstorm', 'special marine', 'squall', 'derecho', 'blizzard',
];

export interface ParsedAlert extends Alert {
  detail: string;
  /** UTC ms, or null when open-ended. */
  endsAt: number | null;
  startsAt: number | null;
}

/** `/alerts/active?point=lat,lon`. Hours are filled per day by `alertsForDay`. */
export function parseNwsAlerts(json: any): ParsedAlert[] {
  const features: any[] = Array.isArray(json?.features) ? json.features : [];
  return features
    .map((f) => f?.properties)
    .filter((p) => p && typeof p.event === 'string' && p.status !== 'Test' && p.messageType !== 'Cancel')
    .map((p) => {
      const event: string = p.event;
      const ends = Date.parse(p.ends ?? p.expires ?? '');
      const starts = Date.parse(p.onset ?? p.effective ?? '');
      return {
        event,
        windRelated: WIND_EVENTS.some((w) => event.toLowerCase().includes(w)),
        detail: String(p.headline ?? p.description ?? event).replace(/\s+/g, ' ').trim(),
        endsAt: Number.isFinite(ends) ? ends : null,
        startsAt: Number.isFinite(starts) ? starts : null,
      };
    });
}

/** Restrict alerts to the local hours they cover on `date`. Alerts not touching the day are dropped. */
export function alertsForDay(alerts: ParsedAlert[], date: string, offset: OffsetFn): ParsedAlert[] {
  const out: ParsedAlert[] = [];
  for (const a of alerts) {
    const startKey = a.startsAt == null ? null : localKey(a.startsAt, offset);
    const endKey = a.endsAt == null ? null : localKey(a.endsAt - 1, offset);
    if (startKey && startKey.slice(0, 10) > date) continue;
    if (endKey && endKey.slice(0, 10) < date) continue;
    out.push({
      ...a,
      startHour: startKey && startKey.slice(0, 10) === date ? Number(startKey.slice(11, 13)) : undefined,
      endHour: endKey && endKey.slice(0, 10) === date ? Number(endKey.slice(11, 13)) + 1 : undefined,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ combining */

/** One source's readings for one local day as an engine series. Hours without wind AND gust are left out. */
export function seriesForDay(f: SourceForecast, date: string): SourceSeries {
  const s: SourceSeries = {};
  for (let hour = 0; hour < 24; hour++) {
    const r = f.hours[`${date}T${String(hour).padStart(2, '0')}`];
    if (!r || r.wind10 == null || r.gust10 == null) continue;
    const h: SourceHour = { wind10: r.wind10, gust10: r.gust10 };
    if (r.wind80 != null) h.wind80 = r.wind80;
    s[hour] = h;
  }
  return s;
}

/** NWS words "slight chance" of thunder start at 15%. Anything at or above counts as storms possible. */
export const THUNDER_POSSIBLE_PCT = 15;

/**
 * Conservative merge of non-wind readings across sources for one local hour:
 * highest rain chance and amount, highest thunder chance, lowest temperature.
 */
export function worstReading(readings: (HourReading | undefined)[]): HourReading {
  const rs = readings.filter((r): r is HourReading => !!r);
  const max = (k: keyof HourReading) => {
    const v = rs.map((r) => r[k]).filter((x): x is number => x != null);
    return v.length ? Math.max(...v) : null;
  };
  const min = (k: keyof HourReading) => {
    const v = rs.map((r) => r[k]).filter((x): x is number => x != null);
    return v.length ? Math.min(...v) : null;
  };
  const first = (k: keyof HourReading) => rs.map((r) => r[k]).find((x) => x != null) ?? null;
  return {
    wind10: max('wind10'),
    gust10: max('gust10'),
    wind80: max('wind80'),
    directionDeg: first('directionDeg'),
    tempF: min('tempF'),
    feelsLikeF: min('feelsLikeF'),
    humidityPct: max('humidityPct'),
    dewPointF: first('dewPointF'),
    rainChancePct: max('rainChancePct'),
    rainIn: max('rainIn'),
    thunderPct: max('thunderPct'),
    uvIndex: max('uvIndex'),
    pressureInHg: first('pressureInHg'),
  };
}
