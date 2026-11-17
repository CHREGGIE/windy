/** Wind-strength levels for the icon. Absolute, independent of the user's limit (ENGINE.md). */
export type WindLevel = 'Calm' | 'Light' | 'Breezy' | 'Strong' | 'Severe';

export const WIND_LEVELS: { name: WindLevel; maxMph: number | null }[] = [
  { name: 'Calm', maxMph: 5 },
  { name: 'Light', maxMph: 12 },
  { name: 'Breezy', maxMph: 20 },
  { name: 'Strong', maxMph: 30 },
  { name: 'Severe', maxMph: null },
];

/** Uses the displayed (rounded-up) gust. */
export function windLevel(gustMph: number): WindLevel {
  const g = Math.ceil(gustMph);
  for (const l of WIND_LEVELS) if (l.maxMph == null || g <= l.maxMph) return l.name;
  return 'Severe';
}

const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
const NAMES = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'] as const;

/** Eight-point compass abbreviation and name for a bearing the wind comes from. */
export function compassPoint(deg: number): { abbr: (typeof POINTS)[number]; name: (typeof NAMES)[number] } {
  const i = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return { abbr: POINTS[i]!, name: NAMES[i]! };
}

export const MPH_TO_KNOTS = 0.868976;
