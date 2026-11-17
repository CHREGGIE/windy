import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { PlaceVerdict } from '@/data/usePlaceVerdicts';
import { accentSolid, color, radius, verdictFill } from '@/theme/tokens';
import { verdictWord } from '@/format';
import { Txt } from './Txt';

export interface PlacesMapProps {
  places: PlaceVerdict[];
  selectedId: string;
  onSelect: (id: string) => void;
  showsUser: boolean;
}

/**
 * Apple Maps on iOS, Google Maps on Android. Each pin is the compass marker style:
 * a round dot in the verdict colour with a white outline, and the verdict word under it.
 */
export function PlacesMap({ places, selectedId, onSelect, showsUser }: PlacesMapProps) {
  const ref = useRef<MapView>(null);
  const selected = places.find((p) => p.place.id === selectedId) ?? places[0];

  useEffect(() => {
    if (!selected) return;
    ref.current?.animateToRegion(
      { latitude: selected.place.lat, longitude: selected.place.lon, latitudeDelta: 0.15, longitudeDelta: 0.15 },
      400,
    );
  }, [selected?.place.id]);

  return (
    <MapView
      ref={ref}
      style={{ flex: 1 }}
      showsUserLocation={showsUser}
      initialRegion={
        selected
          ? { latitude: selected.place.lat, longitude: selected.place.lon, latitudeDelta: 0.15, longitudeDelta: 0.15 }
          : undefined
      }
      accessibilityLabel="Map of your places"
    >
      {places.map(({ place, model }) => {
        const state = model?.state ?? 'UNKNOWN';
        const on = place.id === selectedId;
        const fill = verdictFill(state);
        return (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lon }}
            onPress={() => onSelect(place.id)}
            accessibilityLabel={`${place.name}, ${verdictWord(state)}`}
            anchor={{ x: 0.5, y: 0.3 }}
          >
            <View style={{ alignItems: 'center', gap: 4 }}>
              <View
                style={{
                  width: on ? 34 : 26,
                  height: on ? 34 : 26,
                  borderRadius: radius.pill,
                  backgroundColor: accentSolid(state),
                  borderWidth: 5,
                  borderColor: color.card,
                }}
              />
              <View style={{ backgroundColor: state === 'UNKNOWN' ? color.card : fill.bg, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 8 }}>
                <Txt w="bold" size={11} c={state === 'UNKNOWN' ? color.ink : fill.fg}>
                  {verdictWord(state)}
                </Txt>
              </View>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}
