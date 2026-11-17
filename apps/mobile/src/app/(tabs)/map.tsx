import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { activity } from '@/data/catalog';
import { locateMe } from '@/data/location';
import { HERE_ID } from '@/data/places';
import { usePlaceVerdicts } from '@/data/usePlaceVerdicts';
import { useAppState } from '@/state/AppState';
import { PlacesMap } from '@/components/PlacesMap';
import { PrimaryButton, VerdictPill } from '@/components/ui';
import { MapIcon } from '@/components/icons';
import { Txt } from '@/components/Txt';
import { color, radius, space } from '@/theme/tokens';
import { speed, verdictWord } from '@/format';

/**
 * Map tab: your places as pins coloured by verdict, plus where you are.
 * Radar, wind layers and tide stations wait on a provider decision. Not designed yet.
 */
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { activityId, place, allPlaces, setPlace, upsertPlace } = useAppState();
  const verdicts = usePlaceVerdicts(allPlaces, activityId);
  const [selectedId, setSelectedId] = useState(place.id);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [showsUser, setShowsUser] = useState(false);

  useEffect(() => setSelectedId(place.id), [place.id]);
  useEffect(() => {
    // Show the blue dot only if permission was already given; never ask just for opening the map.
    Location.getForegroundPermissionsAsync()
      .then((p) => setShowsUser(p.status === 'granted'))
      .catch(() => {});
  }, []);

  const selected = verdicts.find((v) => v.place.id === selectedId) ?? verdicts[0];
  const m = selected?.model;
  const a = activity(activityId);
  const u = a.unit === 'kn' ? 'kn' : 'mph';

  const here = async () => {
    setLocating(true);
    setNote(null);
    const r = await locateMe();
    setLocating(false);
    if (!r.ok) {
      setNote(r.message);
      return;
    }
    setShowsUser(true);
    upsertPlace({ id: HERE_ID, name: r.name, short: 'Here', lat: r.lat, lon: r.lon, kind: 'here' });
    setSelectedId(HERE_ID);
  };

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <PlacesMap places={verdicts} selectedId={selectedId} onSelect={setSelectedId} showsUser={showsUser} />

      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 16, left: space.screen, right: space.screen, flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
        <View style={{ backgroundColor: color.card, borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' }}>
          <Txt w="display" size={16} accessibilityRole="header">
            Map
          </Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show where I am"
          onPress={here}
          style={{ backgroundColor: color.ink, borderRadius: radius.pill, minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        >
          {locating ? <ActivityIndicator color={color.card} /> : <MapIcon stroke={color.card} />}
          <Txt w="bold" size={13} c={color.card}>
            Where I am
          </Txt>
        </Pressable>
      </View>

      <View style={{ position: 'absolute', left: space.screen, right: space.screen, bottom: 16, gap: 10 }}>
        {note ? (
          <View style={{ backgroundColor: color.card, borderRadius: radius.tile, padding: 12 }}>
            <Txt size={13} lh={18} c={color.textMuted}>
              {note}
            </Txt>
          </View>
        ) : null}
        {selected ? (
          <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, gap: 3 }}>
                <Txt w="bold" size={17} numberOfLines={1}>
                  {selected.place.kind === 'here' ? 'Where I am' : selected.place.name}
                </Txt>
                <Txt size={13} c={color.textMuted} numberOfLines={2}>
                  {m
                    ? `${a.short}: ${m.current?.gust != null ? `gusts ${speed(m.current.gust, a.unit)} ${u}. ` : ''}${m.line}`
                    : selected.entry.status === 'error'
                      ? 'No forecast right now'
                      : 'Loading…'}
                </Txt>
              </View>
              <VerdictPill state={m?.state ?? 'UNKNOWN'} label={verdictWord(m?.state ?? 'UNKNOWN')} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PrimaryButton
                label="Open"
                style={{ flex: 1 }}
                onPress={() => {
                  setPlace(selected.place.id);
                  router.navigate('/now');
                }}
              />
              <PrimaryButton light label="Add a place" style={{ flex: 1, borderWidth: 2, borderColor: color.ink }} onPress={() => router.push('/add-place')} />
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
