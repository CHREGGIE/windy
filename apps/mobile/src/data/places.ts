import { PLACES as SAMPLE_PLACES, type PlaceId } from './samples';

export type PlaceKind = 'here' | 'saved' | 'example';

export interface SavedPlace {
  id: string;
  /** Full name, e.g. "Red Hook yard" or "123 Van Brunt St". */
  name: string;
  /** Short name for the pill. */
  short: string;
  lat: number;
  lon: number;
  /** `here` is the device's location; `example` uses sample data and is labelled as such. */
  kind: PlaceKind;
  exampleOf?: PlaceId;
}

export const HERE_ID = 'here';

/** The design's three scenarios, kept so go, caution and no-go can be reviewed on any day. */
export const EXAMPLE_PLACES: SavedPlace[] = SAMPLE_PLACES.map((p) => ({
  id: `example-${p.id}`,
  name: `${p.name} (example)`,
  short: p.short,
  lat: p.lat,
  lon: p.lon,
  kind: 'example',
  exampleOf: p.id,
}));

export function shortName(name: string): string {
  const s = name.split(',')[0]!.trim();
  return s.length > 18 ? `${s.slice(0, 17)}…` : s;
}

export function newPlaceId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
