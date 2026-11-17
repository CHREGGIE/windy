import { ScrollView, View } from 'react-native';
import { useNow } from '@/data/useNow';
import { Compass } from '@/components/Compass';
import { TabHeader, UndesignedNote } from '@/components/TabHeader';
import { Card } from '@/components/ui';
import { Txt } from '@/components/Txt';
import { accentSolid, color, space } from '@/theme/tokens';

/**
 * Map tab. Waits on the map provider decision (PRODUCT.md, open decisions), so it shows the pin's
 * coordinates and wind direction only. Uses the compass marker, not an arrow.
 */
export default function MapScreen() {
  const m = useNow();
  return (
    <ScrollView style={{ backgroundColor: color.background }} contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: 24, gap: space.cardGap }}>
      <TabHeader title="Map" pill={`${m.activity.short} · ${m.place.short}`} />
      <UndesignedNote />
      <Card style={{ paddingHorizontal: 18, gap: 12, alignItems: 'flex-start' }}>
        <Txt w="bold" size={15}>
          {m.place.name}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <Compass deg={m.direction.deg} abbr={m.direction.abbr} accent={accentSolid(m.state)} label={`Wind from ${m.direction.name}`} />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt w="semibold" size={13}>
              Wind from the {m.direction.name.toLowerCase()}, {m.direction.deg}°
            </Txt>
            <Txt size={13} c={color.textMuted} style={{ fontVariant: ['tabular-nums'] }}>
              {m.place.lat.toFixed(3)}, {m.place.lon.toFixed(3)}
            </Txt>
          </View>
        </View>
        <Txt size={13} lh={18} c={color.textMuted}>
          The map, radar and wind layers, and tide and buoy stations need a map provider, which has not been chosen.
        </Txt>
      </Card>
    </ScrollView>
  );
}
