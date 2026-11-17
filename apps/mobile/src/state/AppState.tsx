import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ExtraRules } from '@windcheck/engine';
import { ACTIVITIES, type ActivityId } from '@/data/catalog';
import { EXAMPLE_PLACES, HERE_ID, type SavedPlace } from '@/data/places';

export interface ActivitySettings {
  limitMph: number;
  heightFt: number;
  rules: ExtraRules;
  eveningText: boolean;
  changeText: boolean;
}

export type SettingsMap = Record<ActivityId, ActivitySettings>;

export function defaultSettings(id: ActivityId): ActivitySettings {
  const a = ACTIVITIES.find((x) => x.id === id)!;
  return { ...a.defaults, rules: { ...a.defaults.rules }, eveningText: true, changeText: true };
}

interface Persisted {
  v: 1;
  activityId: ActivityId;
  placeId: string;
  /** The user's places, including `here`. Examples are not stored. */
  places: SavedPlace[];
  settings: SettingsMap;
  onboardingPicks: string[];
  onboarded: boolean;
}

const KEY = 'windcheck:state:v1';

interface AppStateValue extends Omit<Persisted, 'v'> {
  /** The user's places first, then the examples. */
  allPlaces: SavedPlace[];
  place: SavedPlace;
  setActivity: (id: ActivityId) => void;
  setPlace: (id: string) => void;
  /** Adds or replaces a place (matching id) and makes it current. */
  upsertPlace: (p: SavedPlace) => void;
  removePlace: (id: string) => void;
  saveSettings: (id: ActivityId, s: ActivitySettings) => void;
  setOnboardingPicks: (picks: string[]) => void;
  setOnboarded: (v: boolean) => void;
}

const Ctx = createContext<AppStateValue | null>(null);

function initial(): Persisted {
  return {
    v: 1,
    activityId: 'crane',
    placeId: EXAMPLE_PLACES[0]!.id,
    places: [],
    settings: Object.fromEntries(ACTIVITIES.map((a) => [a.id, defaultSettings(a.id)])) as SettingsMap,
    onboardingPicks: ['Crane and lifting', 'Roofing'],
    onboarded: false,
  };
}

/** Kept on the device only. Locations are never sent anywhere except to the forecast services. */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as Persisted;
        if (saved?.v !== 1) return;
        const base = initial();
        setState({ ...base, ...saved, settings: { ...base.settings, ...saved.settings } });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const update = useCallback((fn: (s: Persisted) => Persisted) => setState(fn), []);

  const value = useMemo<AppStateValue>(() => {
    const allPlaces = [...state.places.filter((p) => p.id === HERE_ID), ...state.places.filter((p) => p.id !== HERE_ID), ...EXAMPLE_PLACES];
    const place = allPlaces.find((p) => p.id === state.placeId) ?? allPlaces[0]!;
    return {
      activityId: state.activityId,
      placeId: place.id,
      places: state.places,
      settings: state.settings,
      onboardingPicks: state.onboardingPicks,
      onboarded: state.onboarded,
      allPlaces,
      place,
      setActivity: (activityId) => update((s) => ({ ...s, activityId })),
      setPlace: (placeId) => update((s) => ({ ...s, placeId })),
      upsertPlace: (p) => update((s) => ({ ...s, places: [...s.places.filter((x) => x.id !== p.id), p], placeId: p.id })),
      removePlace: (id) =>
        update((s) => ({ ...s, places: s.places.filter((x) => x.id !== id), placeId: s.placeId === id ? EXAMPLE_PLACES[0]!.id : s.placeId })),
      saveSettings: (id, settings) => update((s) => ({ ...s, settings: { ...s.settings, [id]: settings } })),
      setOnboardingPicks: (onboardingPicks) => update((s) => ({ ...s, onboardingPicks })),
      setOnboarded: (onboarded) => update((s) => ({ ...s, onboarded })),
    };
  }, [state, update]);

  if (!ready) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState outside AppStateProvider');
  return v;
}
