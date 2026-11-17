import type { ReactNode } from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import type { HourState } from '@windcheck/engine';
import { color, radius, size, verdictFill } from '@/theme/tokens';
import { Txt } from './Txt';
import { BackIcon } from './icons';

/** White card on warm grey. Radius 22. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: color.card, borderRadius: radius.card, padding: 16 }, style]}>{children}</View>;
}

/** Ink pill, 56 high, Archivo Black 16. `light` is the white variant on the Raw data board. */
export function PrimaryButton({
  label,
  onPress,
  light,
  style,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  light?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: light ? color.card : color.ink,
          minHeight: size.buttonPrimary,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Txt w="display" size={16} c={light ? color.ink : color.card}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** Transparent 44-high text button ("Skip for now", "Reset to defaults"). */
export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: size.touchMin, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}
    >
      <Txt w="semibold" size={15}>
        {label}
      </Txt>
    </Pressable>
  );
}

/** A verdict-coloured pill with its word. Colour is never the only signal. */
export function VerdictPill({
  state,
  label,
  big,
  small,
}: {
  state: HourState;
  label: string;
  /** Archivo 20, padding 10/14: the status-row pill. */
  big?: boolean;
  /** Inter 13 bold, padding 6/12: the peak-gust pill. */
  small?: boolean;
}) {
  const { bg, fg } = verdictFill(state);
  const unknown = state === 'UNKNOWN';
  return (
    <View
      style={{
        backgroundColor: unknown ? 'transparent' : bg,
        borderWidth: unknown ? 2 : 0,
        borderStyle: 'dashed',
        borderColor: color.unknownOutline,
        borderRadius: radius.pill,
        paddingVertical: big ? 10 : small ? 6 : 9,
        paddingHorizontal: big ? 14 : small ? 12 : 14,
        alignSelf: 'flex-start',
      }}
    >
      <Txt w={small ? 'bold' : 'display'} size={big ? 20 : small ? 13 : 14} c={unknown ? color.textMuted : fg} lh={big ? 20 : undefined}>
        {label}
      </Txt>
    </View>
  );
}

/** 44 px round white back button with a title and subtitle (Limits, Raw data boards). */
export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/now'))}
        style={{ backgroundColor: color.card, width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }}
      >
        <BackIcon />
      </Pressable>
      <View style={{ flexShrink: 1 }}>
        <Txt w="display" size={24} lh={26} accessibilityRole="header">
          {title}
        </Txt>
        {subtitle ? (
          <Txt size={13} c={color.textMuted}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
    </View>
  );
}

/** The line CLAUDE.md requires on every verdict surface. Do not soften or remove it. */
export const DISCLAIMER = 'Planning aid only. Your equipment manual and the reading on site govern.';

export function Disclaimer({ sample }: { sample?: boolean }) {
  return (
    <View style={{ gap: 4, paddingHorizontal: 4 }}>
      <Txt size={13} c={color.textMuted} lh={18}>
        {DISCLAIMER}
      </Txt>
      {sample ? (
        <Txt size={13} c={color.textMuted} lh={18}>
          Sample forecast for design review. These are not live readings.
        </Txt>
      ) : null}
    </View>
  );
}
