import { useMemo } from 'react';
import { useAppState } from '@/state/AppState';
import { buildNow, type NowModel } from './now';

export function useNow(): NowModel {
  const { activityId, placeId, settings } = useAppState();
  const s = settings[activityId];
  return useMemo(() => buildNow(activityId, placeId, s), [activityId, placeId, s]);
}
