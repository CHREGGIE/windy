import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '@/state/AppState';
import { AddPlaceForm } from '@/components/AddPlaceForm';
import { TextButton } from '@/components/ui';
import { UndesignedNote } from '@/components/TabHeader';
import { Txt } from '@/components/Txt';
import { color, extra, space } from '@/theme/tokens';

const STEPS = 4;

/**
 * Onboarding step 2: where you work, with the privacy promise (SCREENS.md item 5).
 * Not designed yet. Saved places work with location permission denied.
 */
export default function OnboardingPlace() {
  const insets = useSafeAreaInsets();
  const { upsertPlace, setOnboarded } = useAppState();
  const finish = () => {
    setOnboarded(true);
    router.replace('/now');
  };
  return (
    <ScrollView
      style={{ backgroundColor: color.background }}
      contentContainerStyle={{ flexGrow: 1, paddingTop: 28 + insets.top, paddingHorizontal: space.screen, paddingBottom: 24 + insets.bottom, gap: 18 }}
      keyboardShouldPersistTaps="handled"
    >
      <View accessible accessibilityRole="progressbar" accessibilityLabel={`Step 2 of ${STEPS}`} style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: i <= 1 ? color.ink : extra.stepOff }} />
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <Txt w="display" size={32} lh={35} accessibilityRole="header">
          Where will you work?
        </Txt>
        <Txt size={15} lh={22} c={color.textMuted}>
          Use where you are, or add a site you are heading to. You can add more later. We never sell or share your location.
        </Txt>
        <UndesignedNote />
      </View>
      <AddPlaceForm
        onSaved={(p) => {
          upsertPlace(p);
          finish();
        }}
      />
      <View style={{ marginTop: 'auto' }}>
        <TextButton label="Skip for now" onPress={finish} />
      </View>
    </ScrollView>
  );
}
