import { useMemo } from 'react';
import { useAppState } from '@/state/AppState';
import { useForecast, type ForecastEntry } from '@/state/ForecastStore';
import { buildNow, type NowModel } from './now';

export interface NowState {
  model: NowModel | null;
  entry: ForecastEntry;
  refresh: () => void;
}

/** The current activity and place, with its forecast. `model` is null while nothing has loaded. */
export function useNow(): NowState {
  const { activityId, place, settings } = useAppState();
  const s = settings[activityId];
  const { refresh, ...entry } = useForecast(place);
  const model = useMemo(() => (entry.data ? buildNow(activityId, place, s, entry.data) : null), [activityId, place, s, entry.data]);
  return { model, entry, refresh };
}
