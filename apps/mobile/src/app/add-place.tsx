import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from '@/state/AppState';
import { AddPlaceForm } from '@/components/AddPlaceForm';
import { ScreenHeader } from '@/components/ui';
import { UndesignedNote } from '@/components/TabHeader';
import { color, space } from '@/theme/tokens';

/** Add a place. Not designed yet (SCREENS.md item 4); built from existing components. */
export default function AddPlace() {
  const insets = useSafeAreaInsets();
  const { upsertPlace } = useAppState();
  return (
    <ScrollView
      style={{ backgroundColor: color.background }}
      contentContainerStyle={{ paddingTop: 24 + insets.top, paddingHorizontal: space.screen, paddingBottom: 24 + insets.bottom, gap: 14 }}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title="Add a place" subtitle="A job site, marina or course" />
      <UndesignedNote />
      <AddPlaceForm
        onSaved={(p) => {
          upsertPlace(p);
          router.dismissTo('/now');
        }}
      />
    </ScrollView>
  );
}
