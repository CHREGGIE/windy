import { View } from 'react-native';
import { color, radius } from '@/theme/tokens';
import { Txt } from './Txt';
import type { PlacesMapProps } from './PlacesMap';

/** react-native-maps has no web support. The browser preview shows a placeholder; the phone shows the map. */
export function PlacesMap({ places }: PlacesMapProps) {
  return (
    <View style={{ flex: 1, backgroundColor: color.track, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <View style={{ backgroundColor: color.card, borderRadius: radius.card, padding: 18, gap: 4, maxWidth: 320 }}>
        <Txt w="bold" size={15}>
          The map shows on your phone
        </Txt>
        <Txt size={13} lh={18} c={color.textMuted}>
          Open the app in Expo Go to see {places.length} {places.length === 1 ? 'place' : 'places'} on the map. The browser preview cannot show it.
        </Txt>
      </View>
    </View>
  );
}
