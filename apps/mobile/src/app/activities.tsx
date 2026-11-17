import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HourState } from '@windcheck/engine';
import { ACTIVITIES } from '@/data/catalog';
import { buildNow, dayVerdictLabel } from '@/data/now';
import { useAppState } from '@/state/AppState';
import { useNow } from '@/data/useNow';
import { usePlaceVerdicts } from '@/data/usePlaceVerdicts';
import { Txt } from '@/components/Txt';
import { PrimaryButton, VerdictPill } from '@/components/ui';
import { color, radius, space } from '@/theme/tokens';
import { clockLabel, speed, verdictWord } from '@/format';

function Row({ title, detail, state, selected, onPress }: { title: string; detail: string; state: HourState; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${detail}. ${verdictWord(state)}`}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: color.card,
        borderRadius: radius.card,
        paddingVertical: 14,
        paddingHorizontal: 16,
        minHeight: 52,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        borderWidth: 3,
        borderColor: selected ? color.ink : color.card,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Txt w="bold" size={17}>
          {title}
        </Txt>
        <Txt size={13} c={color.textMuted}>
          {detail}
        </Txt>
      </View>
      <VerdictPill state={state} label={verdictWord(state)} />
    </Pressable>
  );
}

/** Board 3, "Pick your work". Opened from the top-right pill on every tab. */
export default function Activities() {
  const insets = useSafeAreaInsets();
  const { activityId, placeId, place, allPlaces, settings, setActivity, setPlace } = useAppState();
  const { model: m } = useNow();
  const places = usePlaceVerdicts(allPlaces, activityId);
  const gust = m?.current?.gust;
  const unit = m?.activity.unit ?? 'mph';
  const close = () => (router.canGoBack() ? router.back() : router.replace('/now'));

  return (
    <ScrollView style={{ backgroundColor: color.background }} contentContainerStyle={{ paddingBottom: 20 + insets.bottom }}>
      <View
        style={{
          backgroundColor: color.ink,
          borderBottomLeftRadius: radius.hero,
          borderBottomRightRadius: radius.hero,
          paddingTop: 24 + insets.top,
          paddingHorizontal: 22,
          paddingBottom: 28,
          gap: 14,
        }}
      >
        <Txt w="display" size={18} c={color.card} style={{ letterSpacing: 0.36 }}>
          WINDCHECK
        </Txt>
        <Txt w="display" size={32} lh={35} c={color.card} accessibilityRole="header">
          Same wind, your rules
        </Txt>
        <Txt size={15} lh={21} c={color.card}>
          {place.short}
          {m ? `, ${clockLabel(m.sun.nowMinutes).replace(':00', '')}. ` : '. '}
          {gust != null && m
            ? `Gusts ${speed(gust, unit)} ${unit === 'kn' ? 'kn' : 'mph'}${m.direction ? ` from the ${m.direction.name.toLowerCase()}` : ''}.`
            : 'Gusts unknown.'}
        </Txt>
      </View>

      <View style={{ paddingTop: 18, paddingHorizontal: space.screen, gap: 10 }}>
        {ACTIVITIES.map((a) => {
          const v = m ? buildNow(a.id, place, settings[a.id], m.forecast) : null;
          return (
            <Row
              key={a.id}
              title={a.name}
              detail={a.description}
              state={v?.state ?? 'UNKNOWN'}
              selected={a.id === activityId}
              onPress={() => {
                setActivity(a.id);
                close();
              }}
            />
          );
        })}
        <Txt size={13} c={color.textMuted} style={{ paddingTop: 6, paddingHorizontal: 4 }}>
          Only crane is fully worked out. The other activities use placeholder rules while we research them.
        </Txt>

        <Txt w="bold" size={15} style={{ paddingTop: 14, paddingHorizontal: 4 }} accessibilityRole="header">
          Place
        </Txt>
        {places.map(({ place: p, model, entry }) => (
          <Row
            key={p.id}
            title={p.kind === 'here' ? `Where I am · ${p.name}` : p.name}
            detail={model ? `Today: ${dayVerdictLabel(model.days[0]!)}` : entry.status === 'error' ? 'No forecast' : 'Loading…'}
            state={model?.state ?? 'UNKNOWN'}
            selected={p.id === placeId}
            onPress={() => {
              setPlace(p.id);
              close();
            }}
          />
        ))}

        <PrimaryButton light label="Add a place" onPress={() => router.push('/add-place')} style={{ marginTop: 8 }} />
        <PrimaryButton light label={`Your limits for ${(m?.activity.short ?? activityId).toLowerCase()}`} onPress={() => router.push('/limits')} />
        <PrimaryButton label="Add your own activity" onPress={() => Alert.alert('Not built yet', 'Custom activities are not designed yet.')} />
      </View>
    </ScrollView>
  );
}
