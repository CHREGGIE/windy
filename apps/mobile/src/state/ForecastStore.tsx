import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { buildSampleForecast, type PlaceForecast } from '@/data/forecast';
import { fetchLiveForecast } from '@/data/live';
import type { SavedPlace } from '@/data/places';

/** Refetch after this long. Forecasts update hourly at best. */
const FRESH_MS = 15 * 60 * 1000;
/** Older than this, a forecast is shown as stale. */
export const STALE_MS = 3 * 60 * 60 * 1000;

export interface ForecastEntry {
  status: 'loading' | 'ok' | 'error';
  data: PlaceForecast | null;
  /** Set when the latest attempt failed; `data` may still hold an older forecast. */
  error: string | null;
  loading: boolean;
}

const EMPTY: ForecastEntry = { status: 'loading', data: null, error: null, loading: true };

interface Store {
  entries: Record<string, ForecastEntry>;
  ensure: (p: SavedPlace, force?: boolean) => void;
}

const Ctx = createContext<Store | null>(null);

const keyOf = (p: SavedPlace) => (p.kind === 'example' ? p.id : `${p.lat.toFixed(4)},${p.lon.toFixed(4)}`);

export function ForecastProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, ForecastEntry>>({});
  const inflight = useRef(new Set<string>());
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const ensure = useCallback((p: SavedPlace, force = false) => {
    const key = keyOf(p);
    if (p.kind === 'example') {
      if (!entriesRef.current[key]) {
        const data = buildSampleForecast(p.exampleOf!, p.lat, p.lon);
        setEntries((e) => ({ ...e, [key]: { status: 'ok', data, error: null, loading: false } }));
      }
      return;
    }
    const cur = entriesRef.current[key];
    const fresh = cur?.data?.fetchedAt != null && Date.now() - cur.data.fetchedAt < FRESH_MS;
    if (inflight.current.has(key) || (!force && fresh) || (!force && cur?.status === 'error' && !cur.loading)) return;
    inflight.current.add(key);
    setEntries((e) => ({ ...e, [key]: { ...(e[key] ?? EMPTY), loading: true } }));
    fetchLiveForecast(p.lat, p.lon)
      .then((data) => setEntries((e) => ({ ...e, [key]: { status: 'ok', data, error: null, loading: false } })))
      .catch((err: unknown) =>
        setEntries((e) => {
          const prev = e[key];
          const msg = err instanceof Error ? err.message : String(err);
          // Keep showing the last good forecast (marked stale) rather than nothing.
          return { ...e, [key]: prev?.data ? { ...prev, error: msg, loading: false } : { status: 'error', data: null, error: msg, loading: false } };
        }),
      )
      .finally(() => inflight.current.delete(key));
  }, []);

  const value = useMemo(() => ({ entries, ensure }), [entries, ensure]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useForecast outside ForecastProvider');
  return s;
}

export function useForecast(p: SavedPlace): ForecastEntry & { refresh: () => void } {
  const { entries, ensure } = useStore();
  useEffect(() => {
    ensure(p);
  }, [ensure, p]);
  const entry = entries[keyOf(p)] ?? EMPTY;
  return { ...entry, refresh: () => ensure(p, true) };
}

/** Forecasts for several places, for lists and the map. */
export function useForecasts(places: SavedPlace[]): Record<string, ForecastEntry> {
  const { entries, ensure } = useStore();
  useEffect(() => {
    places.forEach((p) => ensure(p));
  }, [ensure, places]);
  return Object.fromEntries(places.map((p) => [p.id, entries[keyOf(p)] ?? EMPTY]));
}
