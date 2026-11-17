import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  alertsForDay,
  evaluate,
  isoDurationHours,
  parseNwsAlerts,
  parseNwsGrid,
  parseNwsPoint,
  parseOpenMeteo,
  seriesForDay,
  worstReading,
} from '../src/index.ts';

const fx = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
const EST = () => -300;

test('Open-Meteo fixture parses to mph and local hours', () => {
  const om = parseOpenMeteo(fx('open-meteo-redhook.json'));
  assert.equal(om.timezone, 'America/New_York');
  assert.equal(om.utcOffsetSeconds, -18000);
  const keys = Object.keys(om.hours);
  assert.equal(keys.length, 96);
  assert.equal(keys[0], '2026-11-17T00');
  const h = om.hours['2026-11-17T00']!;
  assert.equal(h.wind10, 5.5);
  assert.equal(h.gust10, 10.7);
  assert.equal(h.wind80, 10.5);
  assert.ok(h.pressureInHg! > 29 && h.pressureInHg! < 31.5);
  assert.deepEqual(om.sun['2026-11-17'], { sunrise: 6 * 60 + 45, sunset: 16 * 60 + 36 });
});

test('Open-Meteo rejects unexpected units rather than mislabel them', () => {
  const j = fx('open-meteo-redhook.json');
  j.hourly_units.wind_speed_10m = 'km/h';
  assert.throws(() => parseOpenMeteo(j), /unit/);
});

test('NWS durations', () => {
  assert.equal(isoDurationHours('PT1H'), 1);
  assert.equal(isoDurationHours('PT2H'), 2);
  assert.equal(isoDurationHours('P1DT6H'), 30);
  assert.equal(isoDurationHours('P5DT3H'), 123);
});

test('NWS point gives the grid cell', () => {
  const p = parseNwsPoint(fx('nws-points.json'));
  assert.equal(`${p.gridId} ${p.gridX},${p.gridY}`, 'OKX 33,40');
  assert.equal(p.timeZone, 'America/New_York');
});

test('NWS grid converts km/h to mph and expands intervals to local hours', () => {
  const nws = parseNwsGrid(fx('nws-grid.json'), EST);
  // First windSpeed value: 12.964 km/h from 03:00 UTC for 2 h = 22:00 and 23:00 EST on the 16th.
  const a = nws.hours['2026-11-16T22']!;
  const b = nws.hours['2026-11-16T23']!;
  assert.ok(Math.abs(a.wind10! - 12.964 * 0.621371) < 1e-9);
  assert.equal(a.wind10, b.wind10);
  assert.ok(Math.abs(a.gust10! - 16.668 * 0.621371) < 1e-9);
  assert.ok(Math.abs(a.tempF! - (8.333333333333334 * 9 / 5 + 32)) < 1e-9);
  const series = seriesForDay(nws, '2026-11-17');
  assert.ok(Object.keys(series).length >= 20, 'most of today is covered');
});

test('live fixtures run through the engine', () => {
  const om = parseOpenMeteo(fx('open-meteo-redhook.json'));
  const nws = parseNwsGrid(fx('nws-grid.json'), EST);
  const hours = evaluate(
    { startHour: 7, endHour: 16, limitMph: 25, heightFt: 60 },
    { 'Open-Meteo': seriesForDay(om, '2026-11-17'), NWS: seriesForDay(nws, '2026-11-17') },
  );
  assert.equal(hours.length, 9);
  for (const h of hours) {
    assert.notEqual(h.state, 'UNKNOWN');
    assert.equal(h.sources.length, 2);
  }
});

test('either source alone still gives a verdict (milestone 1 acceptance)', () => {
  const om = parseOpenMeteo(fx('open-meteo-redhook.json'));
  const nws = parseNwsGrid(fx('nws-grid.json'), EST);
  const job = { startHour: 7, endHour: 16, limitMph: 25, heightFt: 60 };
  assert.ok(evaluate(job, { 'Open-Meteo': seriesForDay(om, '2026-11-17') }).every((h) => h.state !== 'UNKNOWN'));
  assert.ok(evaluate(job, { NWS: seriesForDay(nws, '2026-11-17') }).every((h) => h.state !== 'UNKNOWN'));
});

test('alerts: empty fixture, and wind events force the right hours', () => {
  assert.deepEqual(parseNwsAlerts(fx('nws-alerts.json')), []);
  const alerts = parseNwsAlerts({
    features: [
      { properties: { event: 'Wind Advisory', headline: 'Wind Advisory until 6 PM', onset: '2026-11-17T15:00:00-05:00', ends: '2026-11-17T18:00:00-05:00', status: 'Actual', messageType: 'Alert' } },
      { properties: { event: 'Coastal Flood Statement', headline: 'x', status: 'Actual', messageType: 'Alert' } },
      { properties: { event: 'Small Craft Advisory', headline: 'y', status: 'Test', messageType: 'Alert' } },
    ],
  });
  assert.deepEqual(alerts.map((a) => [a.event, a.windRelated]), [['Wind Advisory', true], ['Coastal Flood Statement', false]]);
  const today = alertsForDay(alerts, '2026-11-17', EST);
  assert.equal(today[0]!.startHour, 15);
  assert.equal(today[0]!.endHour, 18);
  assert.equal(alertsForDay(alerts, '2026-11-18', EST).filter((a) => a.windRelated).length, 0);
});

test('worst reading merge is conservative', () => {
  const base = parseOpenMeteo(fx('open-meteo-redhook.json')).hours['2026-11-17T12']!;
  const w = worstReading([{ ...base, rainChancePct: 10, tempF: 40 }, { ...base, rainChancePct: 60, tempF: 35 }, undefined]);
  assert.equal(w.rainChancePct, 60);
  assert.equal(w.tempF, 35);
});
