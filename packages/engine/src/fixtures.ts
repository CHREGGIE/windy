/**
 * The prototype's made-up data (prototype/windcheck.py, "fake data"), ported exactly.
 * Every value here is invented for testing. Never present it as a real forecast.
 */
import type { Sources, SourceSeries } from './types.ts';

export const PROTOTYPE_SITES = {
  redhook: { name: 'Red Hook yard', lat: 40.675, lon: -74.012 },
  downtown: { name: 'Downtown Bklyn', lat: 40.692, lon: -73.985 },
  eny: { name: 'East New York lot', lat: 40.666, lon: -73.882 },
} as const;

export const PROTOTYPE_MACHINES = {
  knuckle: { name: 'Knuckle boom', limitMph: 25, heightFt: 60 },
  boomtrk: { name: 'Boom truck', limitMph: 30, heightFt: 100 },
} as const;

/** "Tomorrow" for the prototype's test. */
export const PROTOTYPE_DAY1 = '2026-11-17';

export const PROTOTYPE_JOBS = [
  { id: 1, site: 'redhook', machine: 'knuckle', day: 0, start: 7, end: 16 },
  { id: 2, site: 'downtown', machine: 'boomtrk', day: 0, start: 8, end: 15 },
  { id: 3, site: 'eny', machine: 'knuckle', day: 0, start: 7, end: 15 },
  { id: 4, site: 'redhook', machine: 'knuckle', day: 1, start: 7, end: 16 },
  { id: 5, site: 'redhook', machine: 'knuckle', day: 2, start: 7, end: 16 },
] as const;

/** A made-up series: a front passes at `frontHr`, with an afternoon bump. */
export function fakeSeries(base: number, peak: number, frontHr: number, bias = 0, shear: number | null = 1.35): SourceSeries {
  const out: SourceSeries = {};
  for (let hr = 0; hr < 24; hr++) {
    const ramp = 1 / (1 + Math.exp(-(hr - frontHr) * 1.2));
    const diurnal = 2.5 * Math.sin(((hr - 9) / 24) * 2 * Math.PI);
    const gust = base + (peak - base) * ramp + diurnal + bias;
    const wind = gust / 1.5;
    out[hr] = {
      wind10: Math.max(wind, 1),
      gust10: Math.max(gust, 2),
      ...(shear == null ? {} : { wind80: Math.max(wind, 1) * shear }),
    };
  }
  return out;
}

export type PrototypeRun = 'evening' | 'morning';

/** Two made-up sources per (site, day). Source B has no 80 m wind, like a 10 m-only feed. */
export function fakeForecast(run: PrototypeRun): Record<string, Sources> {
  const front = run === 'evening' ? 14 : 10; // morning run: the front arrives four hours early
  return {
    'redhook:0': { A: fakeSeries(9, 24, front), B: fakeSeries(9, 22, front, -1, null) },
    'downtown:0': { A: fakeSeries(8, 11, 13), B: fakeSeries(8, 12, 13, 0, null) },
    'eny:0': { A: fakeSeries(13, 15, 12), B: fakeSeries(13, 15, 12, -7, null) },
    'redhook:1': { A: fakeSeries(7, 9, 12), B: fakeSeries(7, 10, 12, 0, null) },
    'redhook:2': { A: fakeSeries(24, 30, 9), B: fakeSeries(23, 29, 9, 0, null) },
  };
}
