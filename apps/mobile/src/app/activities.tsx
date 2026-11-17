import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ACTIVITIES } from '@/data/catalog';
import { buildNow, dayVerdictLabel } from '@/data/now';
import { PLACES } from '@/data/samples';
import { useAppState } from '@/state/AppState';
import { useNow } from '@/data/useNow';
import { Txt } from '@/components/Txt';
import { PrimaryButton, VerdictPill } from '@/components/ui';
import { color, radius, space } from '@/theme/tokens';
import { clockLabel, speed, verdictWord } from '@/format';
import type { HourState } from '@windcheck/engine';

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
  const { activityId, placeId, settings, setActivity, setPlace } = useAppState();
  const m = useNow();
  const gust = m.current?.gust;
  const unit = m.activity.unit === 'kn' ? 'kn' : 'mph';

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
          {m.place.short}, {clockLabel(m.sun.nowMinutes).replace(':00', '')}.{' '}
          {gust != null ? `Gusts ${speed(gust, m.activity.unit)} ${unit} from the ${m.direction.name.toLowerCase()}.` : 'Gusts unknown.'}
        </Txt>
      </View>

      <View style={{ paddingTop: 18, paddingHorizontal: space.screen, gap: 10 }}>
        {ACTIVITIES.map((a) => {
          const v = buildNow(a.id, placeId, settings[a.id]);
          return (
            <Row
              key={a.id}
              title={a.name}
              detail={a.description}
              state={v.state}
              selected={a.id === activityId}
              onPress={() => {
                setActivity(a.id);
                router.back();
              }}
            />
          );
        })}
        <Txt size={13} c={color.textMuted} style={{ paddingTop: 6, paddingHorizontal: 4 }}>
          Sample verdicts. Each activity has its own limits, which you can change.
        </Txt>

        <Txt w="bold" size={15} style={{ paddingTop: 14, paddingHorizontal: 4 }} accessibilityRole="header">
          Place
        </Txt>
        {PLACES.map((p) => {
          const v = buildNow(activityId, p.id, settings[activityId]);
          return (
            <Row
              key={p.id}
              title={p.name}
              detail={`${m.activity.name} · Today: ${dayVerdictLabel(v.days[0]!)}`}
              state={v.state}
              selected={p.id === placeId}
              onPress={() => {
                setPlace(p.id);
                router.back();
              }}
            />
          );
        })}

        <PrimaryButton light label={`Your limits for ${m.activity.short.toLowerCase()}`} onPress={() => router.push('/limits')} style={{ marginTop: 8 }} />
        <PrimaryButton
          label="Add your own activity"
          onPress={() => Alert.alert('Not built yet', 'Custom activities are not designed yet.')}
        />
      </View>
    </ScrollView>
  );
}
