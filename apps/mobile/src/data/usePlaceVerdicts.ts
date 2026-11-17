import { useMemo } from 'react';
import type { ActivityId } from './catalog';
import type { SavedPlace } from './places';
import { buildNow, type NowModel } from './now';
import { useAppState } from '@/state/AppState';
import { useForecasts, type ForecastEntry } from '@/state/ForecastStore';

export interface PlaceVerdict {
  place: SavedPlace;
  entry: ForecastEntry;
  model: NowModel | null;
}

/** Each place's forecast evaluated for one activity, for lists and the map. */
export function usePlaceVerdicts(places: SavedPlace[], activityId: ActivityId): PlaceVerdict[] {
  const { settings } = useAppState();
  const entries = useForecasts(places);
  const s = settings[activityId];
  return useMemo(
    () =>
      places.map((place) => {
        const entry = entries[place.id]!;
        return { place, entry, model: entry.data ? buildNow(activityId, place, s, entry.data) : null };
      }),
    // entries is rebuilt each render; key on the data objects instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [places, activityId, s, ...places.map((p) => entries[p.id]?.data)],
  );
}
