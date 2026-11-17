import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ONBOARDING_ACTIVITIES } from '@/data/catalog';
import { useAppState } from '@/state/AppState';
import { Txt } from '@/components/Txt';
import { PickIcon } from '@/components/icons';
import { PrimaryButton, TextButton } from '@/components/ui';
import { color, extra, space } from '@/theme/tokens';

const STEPS = 4;

/**
 * Board 9, onboarding step 1. Step 2 (where you work) is built without a board; steps 3 and 4
 * (limits, text setup) are not designed yet.
 */
export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { onboardingPicks, setOnboardingPicks, setOnboarded } = useAppState();
  const [picks, setPicks] = useState<string[]>(onboardingPicks);
  const toggle = (name: string) => setPicks((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));
  const finish = (save: boolean) => {
    if (save) {
      setOnboardingPicks(picks);
      router.push('/onboarding-place');
    } else {
      setOnboarded(true);
      router.replace('/now');
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: color.background }}
      contentContainerStyle={{ flexGrow: 1, paddingTop: 28 + insets.top, paddingHorizontal: space.screen, paddingBottom: 24 + insets.bottom, gap: 18 }}
    >
      <View accessible accessibilityRole="progressbar" accessibilityLabel={`Step 1 of ${STEPS}`} style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: STEPS }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: i === 0 ? color.ink : extra.stepOff }} />
        ))}
      </View>

      <View style={{ gap: 8 }}>
        <Txt w="display" size={32} lh={35} accessibilityRole="header">
          What does the weather decide for you?
        </Txt>
        <Txt size={15} lh={22} c={color.textMuted}>
          Pick everything you do. Each one gets its own limits, and you can change them later.
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {ONBOARDING_ACTIVITIES.map((name) => {
          const on = picks.includes(name);
          return (
            <Pressable
              key={name}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => toggle(name)}
              style={{
                flexBasis: '47%',
                flexGrow: 1,
                minHeight: 64,
                paddingHorizontal: 14,
                borderRadius: 18,
                backgroundColor: on ? color.go : color.card,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <PickIcon picked={on} />
              <Txt w="bold" size={15} c={on ? color.card : color.ink} style={{ flexShrink: 1 }}>
                {name}
              </Txt>
            </Pressable>
          );
        })}
      </View>
      <Txt size={13} c={color.textMuted} accessibilityLiveRegion="polite">
        {picks.length} selected
      </Txt>

      <View style={{ marginTop: 'auto', gap: 8 }}>
        <PrimaryButton label="Continue" onPress={() => finish(true)} />
        <TextButton label="Skip for now" onPress={() => finish(false)} />
      </View>
    </ScrollView>
  );
}
