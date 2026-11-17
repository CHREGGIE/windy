import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  PROTOTYPE_JOBS,
  PROTOTYPE_MACHINES,
  applyAlerts,
  applyExtraRules,
  alertDayVerdict,
  compassPoint,
  dayVerdict,
  evaluate,
  fakeForecast,
  goHours,
  gustAtHeight,
  lowConfidence,
  shouldSendChange,
  summarize,
  sunTimes,
  windLevel,
  windows,
  type HourResult,
  type Job,
  type Sources,
  type SourceSeries,
} from '../src/index.ts';

/** A single source with these 10 m gusts from `start`, and no 80 m wind. */
function series(start: number, gusts: (number | null)[]): SourceSeries {
  const s: SourceSeries = {};
  gusts.forEach((g, i) => {
    s[start + i] = g == null ? null : { wind10: g / 1.5, gust10: g };
  });
  return s;
}

/** Height 0 ft floors to 10 m, so gusts pass through unscaled. */
const AT_10M = 0;

test('1. limit 25, gusts 9..26 from 7 AM: GO x7, CAUTION, NO-GO; PARTIAL; 7 GO hours', () => {
  const job: Job = { startHour: 7, endHour: 16, limitMph: 25, heightFt: AT_10M };
  const hours = evaluate(job, { A: series(7, [9, 10, 10, 11, 12, 14, 16, 21, 26]) });
  assert.deepEqual(
    hours.map((h) => h.state),
    ['GO', 'GO', 'GO', 'GO', 'GO', 'GO', 'GO', 'CAUTION', 'NO-GO'],
  );
  assert.equal(dayVerdict(hours), 'PARTIAL');
  assert.equal(goHours(hours), 7);
  assert.deepEqual(windows(hours), [
    { state: 'GO', start: 7, end: 14, lo: 9, hi: 16 },
    { state: 'CAUTION', start: 14, end: 15, lo: 21, hi: 21 },
    { state: 'NO-GO', start: 15, end: 16, lo: 26, hi: 26 },
  ]);
});

test('2. wind four hours early: 4 GO hours, change fires though the verdict is still PARTIAL', () => {
  const job: Job = { startHour: 7, endHour: 16, limitMph: 25, heightFt: AT_10M };
  const evening = summarize(evaluate(job, { A: series(7, [9, 10, 10, 11, 12, 14, 16, 21, 26]) }));
  const morning = summarize(evaluate(job, { A: series(7, [9, 10, 12, 16, 21, 26, 27, 28, 28]) }));
  assert.equal(morning.verdict, 'PARTIAL');
  assert.equal(morning.goHours, 4);
  assert.equal(shouldSendChange(evening, morning), true);
  assert.equal(shouldSendChange(evening, { verdict: 'PARTIAL', goHours: 6 }), false);
  assert.equal(shouldSendChange(null, morning), false);
});

test('3. two sources 7 mph apart: low confidence, verdict from the higher source', () => {
  const job: Job = { startHour: 9, endHour: 10, limitMph: 25, heightFt: AT_10M };
  const hours = evaluate(job, { A: series(9, [19]), B: series(9, [26]) });
  assert.equal(hours[0]!.spread, 7);
  assert.equal(lowConfidence(hours), true);
  assert.equal(hours[0]!.gust, 26);
  assert.equal(hours[0]!.state, 'NO-GO');
  assert.equal(lowConfidence(evaluate(job, { A: series(9, [21]), B: series(9, [26]) })), false);
});

test('4. gust 25.4 against limit 25: NO-GO, displayed as 26', () => {
  const job: Job = { startHour: 9, endHour: 10, limitMph: 25, heightFt: AT_10M };
  const [h] = evaluate(job, { A: series(9, [25.4]) });
  assert.equal(h!.state, 'NO-GO');
  assert.equal(h!.gust, 26);
  const [exact] = evaluate(job, { A: series(9, [25]) });
  assert.equal(exact!.state, 'CAUTION', 'exactly at the limit is not over it');
  const [edge] = evaluate(job, { A: series(9, [20]) });
  assert.equal(edge!.state, 'CAUTION', 'caution begins at 80% of the limit, inclusive');
});

test('5. all below 80% is GO, all above the limit is NO-GO', () => {
  const job: Job = { startHour: 7, endHour: 10, limitMph: 25, heightFt: AT_10M };
  assert.equal(dayVerdict(evaluate(job, { A: series(7, [5, 10, 19.9]) })), 'GO');
  assert.equal(dayVerdict(evaluate(job, { A: series(7, [26, 30, 40]) })), 'NO-GO');
  assert.equal(dayVerdict(evaluate(job, { A: series(7, [10, 21, 22]) })), 'CAUTION');
});

test('6. a source without 80 m wind uses alpha 0.20', () => {
  assert.equal(gustAtHeight({ wind10: 10, gust10: 14 }, 60).alpha, 0.2);
  assert.equal(gustAtHeight({ wind10: 10, gust10: 14, wind80: null }, 60).alpha, 0.2);
  assert.equal(gustAtHeight({ wind10: 10, gust10: 14, wind80: 9 }, 60).alpha, 0.2, '80 m wind not above 10 m');
  const withShear = gustAtHeight({ wind10: 10, gust10: 14, wind80: 13.5 }, 60);
  assert.ok(Math.abs(withShear.alpha - Math.log(1.35) / Math.log(8)) < 1e-12);
});

test('7. 14 mph at 10 m, 60 ft, alpha 0.20 gives 15.8 mph, displayed as 16', () => {
  const { gust } = gustAtHeight({ wind10: 10, gust10: 14 }, 60);
  assert.equal(Math.round(gust * 10) / 10, 15.8);
  const [h] = evaluate({ startHour: 9, endHour: 10, limitMph: 25, heightFt: 60 }, { A: series(9, [14]) });
  assert.equal(h!.gust, 16);
});

test('height below 10 m floors at 10 m', () => {
  assert.equal(gustAtHeight({ wind10: 10, gust10: 14 }, 20).gust, 14);
});

test('matches prototype/sample-run.jsonl hour for hour', () => {
  const path = fileURLToPath(new URL('../../../prototype/sample-run.jsonl', import.meta.url));
  const rows = readFileSync(path, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.equal(rows.length, 10);
  const runs = { evening: fakeForecast('evening'), morning: fakeForecast('morning') };
  for (const row of rows) {
    const run = row.run.startsWith('6pm') ? runs.evening : runs.morning;
    const spec = PROTOTYPE_JOBS.find((j) => j.id === row.job)!;
    const machine = PROTOTYPE_MACHINES[spec.machine];
    const job: Job = { startHour: spec.start, endHour: spec.end, limitMph: machine.limitMph, heightFt: machine.heightFt };
    const hours = evaluate(job, run[`${spec.site}:${spec.day}`] as Sources);
    assert.deepEqual(
      hours.map(({ hour, gust, spread, state }) => ({ hour, gust, spread, state })),
      row.hours,
      `${row.run} job ${row.job}`,
    );
    assert.equal(dayVerdict(hours), row.verdict, `${row.run} job ${row.job} verdict`);
  }
});

test('prototype morning run fires a change for job 1 only by GO hours', () => {
  const job: Job = { startHour: 7, endHour: 16, limitMph: 25, heightFt: 60 };
  const evening = summarize(evaluate(job, fakeForecast('evening')['redhook:0']!));
  const morning = summarize(evaluate(job, fakeForecast('morning')['redhook:0']!));
  assert.equal(evening.verdict, morning.verdict);
  assert.equal(shouldSendChange(evening, morning), true);
});

test('8. unknown: no data is never GO and never filled from a neighbour', () => {
  const job: Job = { startHour: 7, endHour: 10, limitMph: 25, heightFt: AT_10M };
  const hours = evaluate(job, { A: series(7, [10, null, 10]) });
  assert.deepEqual(hours.map((h) => h.state), ['GO', 'UNKNOWN', 'GO']);
  assert.equal(hours[1]!.gust, null);
  assert.equal(dayVerdict(hours), 'UNKNOWN');
  assert.equal(dayVerdict(evaluate(job, {})), 'UNKNOWN', 'every source failed');
  assert.equal(dayVerdict(evaluate(job, { A: series(7, [30, null, 10]) })), 'PARTIAL');
  // One source missing an hour while the other has it: use the one that has it.
  const both = evaluate(job, { A: series(7, [10, null, 10]), B: series(7, [11, 12, 11]) });
  assert.deepEqual(both.map((h) => h.state), ['GO', 'GO', 'GO']);
});

test('7. a wind alert forces at least CAUTION; no alert changes nothing', () => {
  const job: Job = { startHour: 12, endHour: 15, limitMph: 25, heightFt: AT_10M };
  const hours = evaluate(job, { A: series(12, [10, 10, 30]) });
  const alerted = applyAlerts(hours, [{ event: 'Wind Advisory', windRelated: true, startHour: 13 }]);
  assert.deepEqual(alerted.map((h) => h.state), ['GO', 'CAUTION', 'NO-GO']);
  assert.equal(applyAlerts(hours, []), hours);
  assert.equal(applyAlerts(hours, [{ event: 'Coastal Flood', windRelated: false }]), hours);
  assert.equal(alertDayVerdict('GO', [{ event: 'Wind Advisory', windRelated: true }]), 'CAUTION');
});

test('9. extra rules: the worst state wins, unknown input is UNKNOWN', () => {
  const job: Job = { startHour: 9, endHour: 12, limitMph: 25, heightFt: AT_10M };
  const hours: HourResult[] = evaluate(job, { A: series(9, [10, 10, 10]) });
  const conditions = [
    { hour: 9, stormsForecast: true, rainChancePct: 10, tempF: 40 },
    { hour: 10, stormsForecast: false, rainChancePct: 60, tempF: 31 },
    { hour: 11, stormsForecast: null, rainChancePct: 10, tempF: 40 },
  ];
  const all = applyExtraRules(hours, { lightning: true, rain: true, freezing: true }, conditions);
  assert.deepEqual(all.map((h) => h.state), ['NO-GO', 'CAUTION', 'UNKNOWN']);
  const off = applyExtraRules(hours, { lightning: false, rain: false, freezing: false }, conditions);
  assert.equal(off, hours);
  const rainOnly = applyExtraRules(hours, { lightning: false, rain: true, freezing: false }, conditions);
  assert.deepEqual(rainOnly.map((h) => h.state), ['GO', 'CAUTION', 'GO']);
});

test('wind levels follow the ENGINE.md table', () => {
  assert.deepEqual([0, 5, 6, 12, 13, 20, 21, 30, 31].map(windLevel), [
    'Calm', 'Calm', 'Light', 'Light', 'Breezy', 'Breezy', 'Strong', 'Strong', 'Severe',
  ]);
  assert.equal(windLevel(5.2), 'Light', 'uses the rounded-up gust');
});

test('compass points', () => {
  assert.deepEqual(compassPoint(225), { abbr: 'SW', name: 'Southwest' });
  assert.deepEqual(compassPoint(315), { abbr: 'NW', name: 'Northwest' });
  assert.deepEqual(compassPoint(359), { abbr: 'N', name: 'North' });
  assert.deepEqual(compassPoint(-90), { abbr: 'W', name: 'West' });
});

test('sunrise and sunset for Red Hook on 17 Nov 2026 are about 6:44 AM and 4:36 PM EST', () => {
  const { sunrise, sunset } = sunTimes('2026-11-17', 40.675, -74.012, -300);
  assert.ok(sunrise != null && Math.abs(sunrise - (6 * 60 + 44)) <= 3, `sunrise ${sunrise}`);
  assert.ok(sunset != null && Math.abs(sunset - (16 * 60 + 36)) <= 3, `sunset ${sunset}`);
});
