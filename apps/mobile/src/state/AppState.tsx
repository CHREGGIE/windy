import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ExtraRules } from '@windcheck/engine';
import { ACTIVITIES, type ActivityId } from '@/data/catalog';
import type { PlaceId } from '@/data/samples';

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

interface AppStateValue {
  activityId: ActivityId;
  placeId: PlaceId;
  settings: SettingsMap;
  onboardingPicks: string[];
  setActivity: (id: ActivityId) => void;
  setPlace: (id: PlaceId) => void;
  saveSettings: (id: ActivityId, s: ActivitySettings) => void;
  setOnboardingPicks: (picks: string[]) => void;
}

const Ctx = createContext<AppStateValue | null>(null);

/** In-memory only for now. Persistence arrives with the Supabase tables (milestone 2). */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activityId, setActivity] = useState<ActivityId>('crane');
  const [placeId, setPlace] = useState<PlaceId>('redhook');
  const [onboardingPicks, setOnboardingPicks] = useState<string[]>(['Crane and lifting', 'Roofing']);
  const [settings, setSettings] = useState<SettingsMap>(
    () => Object.fromEntries(ACTIVITIES.map((a) => [a.id, defaultSettings(a.id)])) as SettingsMap,
  );

  const value = useMemo<AppStateValue>(
    () => ({
      activityId,
      placeId,
      settings,
      onboardingPicks,
      setActivity,
      setPlace,
      saveSettings: (id, s) => setSettings((prev) => ({ ...prev, [id]: s })),
      setOnboardingPicks,
    }),
    [activityId, placeId, settings, onboardingPicks],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState(): AppStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppState outside AppStateProvider');
  return v;
}
