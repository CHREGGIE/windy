import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { buildNow } from '@/data/now';
import { PLACES } from '@/data/samples';
import { useAppState } from '@/state/AppState';
import { useNow } from '@/data/useNow';
import { TabHeader, UndesignedNote } from '@/components/TabHeader';
import { Disclaimer, VerdictPill } from '@/components/ui';
import { Txt } from '@/components/Txt';
import { color, radius, space } from '@/theme/tokens';
import { speed, verdictWord } from '@/format';

/** Places tab. Not designed yet: saved places, each with its own verdict. Tap one to make it current. */
export default function PlacesScreen() {
  const m = useNow();
  const { activityId, placeId, settings, setPlace } = useAppState();
  const u = m.activity.unit === 'kn' ? 'kn' : 'mph';

  return (
    <ScrollView style={{ backgroundColor: color.background }} contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: 24, gap: 10 }}>
      <TabHeader title="Your places" pill={`${m.activity.short} · ${m.place.short}`} />
      <UndesignedNote />
      {PLACES.map((p) => {
        const v = buildNow(activityId, p.id, settings[activityId]);
        const selected = p.id === placeId;
        return (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${p.name}. ${verdictWord(v.state)} now`}
            onPress={() => {
              setPlace(p.id);
              router.navigate('/now');
            }}
            style={{
              backgroundColor: color.card,
              borderRadius: radius.card,
              paddingVertical: 14,
              paddingHorizontal: 16,
              minHeight: 52,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              borderWidth: 3,
              borderColor: selected ? color.ink : color.card,
            }}
          >
            <View style={{ flex: 1, gap: 3 }}>
              <Txt w="bold" size={17}>
                {p.name}
              </Txt>
              <Txt size={13} c={color.textMuted}>
                {v.current?.gust != null ? `Gusts ${speed(v.current.gust, m.activity.unit)} ${u} · ${v.line}` : 'No forecast for this hour'}
              </Txt>
            </View>
            <VerdictPill state={v.state} label={verdictWord(v.state)} />
          </Pressable>
        );
      })}
      <Txt size={13} lh={18} c={color.textMuted} style={{ paddingHorizontal: 4 }}>
        Saved places work without location permission. Your location is never sold or shared.
      </Txt>
      <Disclaimer sample={m.isSample} />
    </ScrollView>
  );
}
