import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { HourState } from '@windcheck/engine';
import { color, fontSize, heroColors, radius, scale } from '@/theme/tokens';
import { limitDisplay, speed, verdictWord, type SpeedUnit } from '@/format';
import { Txt } from './Txt';

export interface HeroProps {
  state: HourState;
  gustMph: number | null;
  steadyMph: number | null;
  limitMph: number;
  unit: SpeedUnit;
  line: string;
  pillLabel: string;
  onPillPress: () => void;
}

const BAR_GUST = 24;
const BAR_STEADY = 14;
const LABEL_SPACE = 30;
const GAP = 12;
const LIMIT_LABEL_W = 120;

function frac(v: number, max: number) {
  return `${Math.max(0, Math.min(1, v / max)) * 100}%` as const;
}

/**
 * The full-colour block at the top of Now. Colour follows the verdict; the word always appears with it.
 * Bars: gusts thick, steady thin, on a 0–40 mph scale, with the user's limit crossing both.
 */
export function Hero({ state, gustMph, steadyMph, limitMph, unit, line, pillLabel, onPillPress }: HeroProps) {
  const insets = useSafeAreaInsets();
  const c = heroColors(state);
  // Widen the scale only when the limit or the gust would fall off the end.
  const maxMph = Math.max(scale.windMaxMph, Math.ceil(Math.max(limitMph, gustMph ?? 0) / 10) * 10);
  const gust = gustMph == null ? null : speed(gustMph, unit);
  const steady = steadyMph == null ? null : speed(steadyMph, unit);
  const limit = limitDisplay(limitMph, unit);
  const unitWord = unit === 'kn' ? 'kn' : 'mph';
  const a11y =
    gust == null
      ? `Gusts unknown against a ${limit} ${unitWord} limit`
      : `Gusts ${gust} ${unitWord}${steady != null ? ` and steady wind ${steady} ${unitWord}` : ''} against a ${limit} ${unitWord} limit`;

  return (
    <View
      style={{
        backgroundColor: c.background,
        borderBottomLeftRadius: radius.hero,
        borderBottomRightRadius: radius.hero,
        paddingTop: 24 + insets.top,
        paddingHorizontal: 22,
        paddingBottom: 22,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt w="display" size={18} c={c.text} style={{ letterSpacing: 0.36 }}>
          WINDCHECK
        </Txt>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${pillLabel}. Change activity or place`}
          onPress={onPillPress}
          style={({ pressed }) => ({
            backgroundColor: color.card,
            borderRadius: radius.pill,
            paddingVertical: 12,
            paddingHorizontal: 16,
            minHeight: 44,
            justifyContent: 'center',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Txt w="semibold" size={13}>
            {pillLabel}
          </Txt>
        </Pressable>
      </View>

      <View style={{ marginTop: 18 }} accessible accessibilityLabel={`${gust ?? 'Unknown'} ${unitWord} gusts. ${verdictWord(state)}. ${line}`}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Txt w="display" size={fontSize.heroNumber} lh={fontSize.heroNumber * 1.0} c={c.text}>
            {gust ?? '?'}
          </Txt>
          <Txt w="semibold" size={16} c={c.text}>
            {unitWord} gusts
          </Txt>
        </View>
        <Txt w="display" size={fontSize.verdict} lh={fontSize.verdict * 1.2} c={c.text} style={{ marginTop: 6 }}>
          {verdictWord(state)}
        </Txt>
        <Txt w="medium" size={15} c={c.text}>
          {line}
        </Txt>
      </View>

      <View accessible accessibilityRole="image" accessibilityLabel={a11y} style={{ flexDirection: 'row', gap: GAP, marginTop: 22 }}>
        <View style={{ paddingTop: LABEL_SPACE, gap: GAP }}>
          <View style={{ height: BAR_GUST, justifyContent: 'center' }}>
            <Txt w="semibold" size={13} c={c.text}>
              Gusts
            </Txt>
          </View>
          <View style={{ height: BAR_STEADY, justifyContent: 'center' }}>
            <Txt w="semibold" size={13} c={c.text}>
              Steady
            </Txt>
          </View>
        </View>
        <View style={{ flex: 1, paddingTop: LABEL_SPACE, gap: GAP }}>
          <Bar height={BAR_GUST} value={gustMph} max={maxMph} track={c.barTrack} fill={c.barFill} />
          <Bar height={BAR_STEADY} value={steadyMph} max={maxMph} track={c.barTrack} fill={c.barFill} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
            <Txt w="semibold" size={13} c={c.text}>
              0 calm
            </Txt>
            <Txt w="semibold" size={13} c={c.text}>
              {speed(maxMph, unit)} {unitWord}
            </Txt>
          </View>
          {/* Limit label and marker, positioned on the bar area. */}
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
            <Txt
              w="bold"
              size={13}
              c={c.limitMarker}
              numberOfLines={1}
              style={{ position: 'absolute', top: 0, left: frac(limitMph, maxMph), width: LIMIT_LABEL_W, marginLeft: -LIMIT_LABEL_W / 2, textAlign: 'center' }}
            >
              Your limit {limit}
            </Txt>
            <View
              style={{
                position: 'absolute',
                left: frac(limitMph, maxMph),
                top: 22,
                height: 66,
                width: 5,
                marginLeft: -2.5,
                borderRadius: radius.pill,
                backgroundColor: c.limitMarker,
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function Bar({ height, value, max, track, fill }: { height: number; value: number | null; max: number; track: string; fill: string }) {
  return (
    <View style={{ height, borderRadius: radius.pill, backgroundColor: track, overflow: 'hidden' }}>
      {value != null ? <View style={{ width: frac(value, max), height, borderRadius: radius.pill, backgroundColor: fill }} /> : null}
    </View>
  );
}
