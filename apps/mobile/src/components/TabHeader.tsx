import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius } from '@/theme/tokens';
import { Txt } from './Txt';

/**
 * Header for the tabs that have no board yet: wordmark left, activity and place pill right
 * (the pill opens Pick your work on every tab), then a screen title.
 */
export function TabHeader({ title, pill }: { title: string; pill: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: 24 + insets.top, gap: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt w="display" size={18} style={{ letterSpacing: 0.36 }}>
          WINDCHECK
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${pill}. Change activity or place`}
          onPress={() => router.push('/activities')}
          style={{ backgroundColor: color.card, borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: 16, minHeight: 44, justifyContent: 'center' }}
        >
          <Txt w="semibold" size={13}>
            {pill}
          </Txt>
        </Pressable>
      </View>
      <Txt w="display" size={24} lh={28} accessibilityRole="header">
        {title}
      </Txt>
    </View>
  );
}

/** Marks a screen built from existing components without a board, for the owner's review. */
export function UndesignedNote() {
  return (
    <Txt size={13} lh={18} c={color.textMuted}>
      Not designed yet. Built from the existing components for review.
    </Txt>
  );
}
