import type { OffsetFn } from '@windcheck/engine';

/**
 * UTC offset for an IANA time zone at a given instant, so DST is handled per hour.
 * Falls back to a fixed offset if this device's Intl cannot do time zones.
 */
export function offsetFnFor(timeZone: string | null | undefined, fallbackMinutes: number): OffsetFn {
  if (!timeZone) return () => fallbackMinutes;
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const fn: OffsetFn = (ms) => {
      const parts: Record<string, string> = {};
      for (const p of fmt.formatToParts(ms)) parts[p.type] = p.value;
      const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute));
      return Math.round((asUtc - Math.floor(ms / 60000) * 60000) / 60000);
    };
    if (!Number.isFinite(fn(Date.now()))) return () => fallbackMinutes;
    return fn;
  } catch {
    return () => fallbackMinutes;
  }
}

/** `YYYY-MM-DD` plus n days. */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function dayName(date: string): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]!;
}
