/**
 * Fetching live forecasts. NWS is primary in the docs, Open-Meteo second and the source of 80 m wind;
 * the engine takes the worse of the two per hour. Either can fail and the other still gives a verdict.
 */
import { Platform } from 'react-native';
import { parseNwsAlerts, parseNwsGrid, parseNwsPoint, parseOpenMeteo, type NwsPoint } from '@windcheck/engine';
import { buildLiveForecast, type LiveParts, type PlaceForecast } from './forecast';
import { offsetFnFor } from './time';

const TIMEOUT_MS = 15000;
const TRIES = 3;
/** NWS asks every client to identify itself. Browsers do not allow setting this header. */
const NWS_HEADERS: Record<string, string> =
  Platform.OS === 'web'
    ? { Accept: 'application/geo+json' }
    : { Accept: 'application/geo+json', 'User-Agent': 'WindCheck app (github.com/CHREGGIE/windy)' };

class HttpError extends Error {
  constructor(public status: number, url: string) {
    super(`HTTP ${status} from ${new URL(url).host}`);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET JSON with a timeout, retrying network errors and 5xx with backoff (0.5 s, 1 s). */
async function getJson(url: string, headers?: Record<string, string>): Promise<any> {
  let last: unknown;
  for (let attempt = 0; attempt < TRIES; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { headers, signal: ctrl.signal });
      if (res.ok) return await res.json();
      last = new HttpError(res.status, url);
      if (res.status < 500 && res.status !== 429) break;
    } catch (e) {
      last = e;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < TRIES - 1) await sleep(500 * 2 ** attempt);
  }
  throw last instanceof Error ? last : new Error(String(last));
}

const r4 = (x: number) => Math.round(x * 10000) / 10000;

function openMeteoUrl(lat: number, lon: number) {
  const hourly = [
    'wind_speed_10m', 'wind_gusts_10m', 'wind_speed_80m', 'wind_direction_10m', 'temperature_2m', 'apparent_temperature',
    'relative_humidity_2m', 'dew_point_2m', 'precipitation_probability', 'precipitation', 'weather_code', 'uv_index', 'pressure_msl',
  ].join(',');
  return (
    `https://api.open-meteo.com/v1/forecast?latitude=${r4(lat)}&longitude=${r4(lon)}&hourly=${hourly}` +
    '&daily=sunrise,sunset&wind_speed_unit=mph&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto&forecast_days=5'
  );
}

/** Grid cells do not move; cache them per place (DATA_SOURCES.md). */
const pointCache = new Map<string, NwsPoint | 'outside'>();

async function nwsPoint(lat: number, lon: number): Promise<NwsPoint | 'outside'> {
  const key = `${r4(lat)},${r4(lon)}`;
  const hit = pointCache.get(key);
  if (hit) return hit;
  try {
    const p = parseNwsPoint(await getJson(`https://api.weather.gov/points/${key}`, NWS_HEADERS));
    pointCache.set(key, p);
    return p;
  } catch (e) {
    // NWS covers the US only; a 404 means the point is outside its area.
    if (e instanceof HttpError && e.status === 404) {
      pointCache.set(key, 'outside');
      return 'outside';
    }
    throw e;
  }
}

function describe(e: unknown): string {
  if (e instanceof Error) return e.name === 'AbortError' ? 'timed out' : e.message;
  return String(e);
}

export async function fetchLiveForecast(lat: number, lon: number): Promise<PlaceForecast> {
  const errors: string[] = [];
  const [om, nwsPt] = await Promise.allSettled([getJson(openMeteoUrl(lat, lon)).then(parseOpenMeteo), nwsPoint(lat, lon)]);
  const openMeteo = om.status === 'fulfilled' ? om.value : null;
  if (om.status === 'rejected') errors.push(`Open-Meteo: ${describe(om.reason)}`);

  const fallbackOffset = openMeteo ? openMeteo.utcOffsetSeconds / 60 : -new Date().getTimezoneOffset();
  let timezone = openMeteo?.timezone ?? null;
  let parts: LiveParts = { openMeteo, nws: null, alerts: null, errors, grid: null, timezone };

  if (nwsPt.status === 'rejected') {
    errors.push(`NWS: ${describe(nwsPt.reason)}`);
  } else if (nwsPt.value === 'outside') {
    errors.push('NWS: this place is outside the US, so only Open-Meteo is used');
  } else {
    const pt = nwsPt.value;
    timezone = timezone ?? pt.timeZone;
    const offset = offsetFnFor(timezone, fallbackOffset);
    const [grid, alerts] = await Promise.allSettled([
      getJson(pt.forecastGridData, NWS_HEADERS).then((j) => parseNwsGrid(j, offset)),
      getJson(`https://api.weather.gov/alerts/active?point=${r4(lat)},${r4(lon)}`, NWS_HEADERS).then(parseNwsAlerts),
    ]);
    if (grid.status === 'rejected') errors.push(`NWS forecast: ${describe(grid.reason)}`);
    if (alerts.status === 'rejected') errors.push(`NWS alerts: ${describe(alerts.reason)}`);
    parts = {
      ...parts,
      nws: grid.status === 'fulfilled' ? grid.value : null,
      alerts: alerts.status === 'fulfilled' ? alerts.value : null,
      grid: `${pt.gridId} ${pt.gridX},${pt.gridY}`,
      timezone,
    };
  }

  if (!parts.openMeteo && !parts.nws) {
    throw new Error(errors.join('; ') || 'No forecast source answered');
  }
  return buildLiveForecast(parts, offsetFnFor(timezone, fallbackOffset), Date.now(), lat, lon);
}
