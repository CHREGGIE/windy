import { MPH_TO_KNOTS, type DayVerdict, type HourState } from '@windcheck/engine';

export type SpeedUnit = 'mph' | 'kn';

/** Convert at the display edge. Rounded up, so a value never reads below the engine's number. */
export function speed(mph: number, unit: SpeedUnit): number {
  return unit === 'kn' ? Math.ceil(mph * MPH_TO_KNOTS - 1e-9) : Math.ceil(mph - 1e-9);
}

/** A limit is a setting the user typed, so it rounds to nearest rather than up. */
export function limitDisplay(mph: number, unit: SpeedUnit): number {
  return unit === 'kn' ? Math.round(mph * MPH_TO_KNOTS) : Math.round(mph);
}

export function limitFromDisplay(value: number, unit: SpeedUnit): number {
  return unit === 'kn' ? value / MPH_TO_KNOTS : value;
}

/** 13 -> "1 PM", 0 -> "12 AM". */
export function hourLabel(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  return `${hh % 12 === 0 ? 12 : hh % 12} ${hh < 12 ? 'AM' : 'PM'}`;
}

/** Minutes after midnight -> { time: "6:44", meridiem: "AM" }. */
export function clockParts(minutes: number): { time: string; meridiem: 'AM' | 'PM' } {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60) % 24;
  const mm = m % 60;
  return { time: `${h % 12 === 0 ? 12 : h % 12}:${String(mm).padStart(2, '0')}`, meridiem: h < 12 ? 'AM' : 'PM' };
}

export function clockLabel(minutes: number): string {
  const { time, meridiem } = clockParts(minutes);
  return `${time} ${meridiem}`;
}

export function durationLabel(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  return h > 0 ? `${h} h ${m % 60} min` : `${m} min`;
}

/** The verdict word that always accompanies a verdict colour. */
export function verdictWord(state: HourState | DayVerdict): string {
  switch (state) {
    case 'GO':
      return 'Go';
    case 'CAUTION':
      return 'Caution';
    case 'NO-GO':
      return 'No-go';
    case 'PARTIAL':
      return 'Partly';
    default:
      return 'Unknown';
  }
}

/** The word in an hourly row or a peak-gust pill. */
export function limitWord(state: HourState): string {
  switch (state) {
    case 'GO':
      return 'Under limit';
    case 'CAUTION':
      return 'Near limit';
    case 'NO-GO':
      return 'Over limit';
    default:
      return 'Unknown';
  }
}

export function hourlyWord(state: HourState): string {
  return state === 'GO' ? 'Go' : limitWord(state);
}
