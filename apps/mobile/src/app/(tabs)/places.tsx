import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useAppState } from '@/state/AppState';
import { activity } from '@/data/catalog';
import { usePlaceVerdicts, type PlaceVerdict } from '@/data/usePlaceVerdicts';
import { TabHeader, UndesignedNote } from '@/components/TabHeader';
import { Disclaimer, PrimaryButton, VerdictPill } from '@/components/ui';
import { Txt } from '@/components/Txt';
import { color, radius, space } from '@/theme/tokens';
import { speed, verdictWord } from '@/format';

function PlaceRow({ v, selected, onPress, onRemove }: { v: PlaceVerdict; selected: boolean; onPress: () => void; onRemove?: () => void }) {
  const { place: p, model, entry } = v;
  const state = model?.state ?? 'UNKNOWN';
  const u = model?.activity.unit === 'kn' ? 'kn' : 'mph';
  const detail = model
    ? model.current?.gust != null
      ? `Gusts ${speed(model.current.gust, model.activity.unit)} ${u} · ${model.line}`
      : 'No forecast for this hour'
    : entry.status === 'error'
      ? 'No forecast right now'
      : 'Loading…';
  return (
    <View
      style={{
        backgroundColor: color.card,
        borderRadius: radius.card,
        borderWidth: 3,
        borderColor: selected ? color.ink : color.card,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`${p.name}. ${verdictWord(state)} now. ${detail}`}
        onPress={onPress}
        style={{ paddingVertical: 14, paddingHorizontal: 16, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Txt w="bold" size={17}>
            {p.kind === 'here' ? `Where I am` : p.name}
          </Txt>
          {p.kind === 'here' ? (
            <Txt size={13} c={color.textMuted}>
              {p.name}
            </Txt>
          ) : null}
          <Txt size={13} c={color.textMuted}>
            {detail}
          </Txt>
        </View>
        <VerdictPill state={state} label={verdictWord(state)} />
      </Pressable>
      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${p.name}`}
          onPress={onRemove}
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: color.hairline }}
        >
          <Txt w="semibold" size={13} c={color.textMuted}>
            Remove
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Places tab. Not designed yet: saved places, each with its own verdict. Tap one to make it current. */
export default function PlacesScreen() {
  const { activityId, place, allPlaces, setPlace, removePlace } = useAppState();
  const verdicts = usePlaceVerdicts(allPlaces, activityId);
  const mine = verdicts.filter((v) => v.place.kind !== 'example');
  const examples = verdicts.filter((v) => v.place.kind === 'example');
  const pick = (id: string) => {
    setPlace(id);
    router.navigate('/now');
  };
  const confirmRemove = (id: string, name: string) =>
    Alert.alert('Remove place?', name, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removePlace(id) },
    ]);

  return (
    <ScrollView style={{ backgroundColor: color.background }} contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: 24, gap: 10 }}>
      <TabHeader title="Your places" pill={`${activity(activityId).short} · ${place.short}`} />
      <UndesignedNote />
      {mine.length === 0 ? (
        <Txt size={15} lh={21} c={color.textMuted}>
          No places yet. Add where you are, or a site you are heading to.
        </Txt>
      ) : null}
      {mine.map((v) => (
        <PlaceRow key={v.place.id} v={v} selected={v.place.id === place.id} onPress={() => pick(v.place.id)} onRemove={() => confirmRemove(v.place.id, v.place.name)} />
      ))}
      <PrimaryButton label="Add a place" onPress={() => router.push('/add-place')} />

      <Txt w="bold" size={15} style={{ paddingTop: 14, paddingHorizontal: 4 }} accessibilityRole="header">
        Examples, sample data
      </Txt>
      {examples.map((v) => (
        <PlaceRow key={v.place.id} v={v} selected={v.place.id === place.id} onPress={() => pick(v.place.id)} />
      ))}
      <Txt size={13} lh={18} c={color.textMuted} style={{ paddingHorizontal: 4 }}>
        Saved places work without location permission. Your location is never sold or shared.
      </Txt>
      <Disclaimer />
    </ScrollView>
  );
}
