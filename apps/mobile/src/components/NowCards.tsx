import { Pressable, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { HourResult, HourState } from '@windcheck/engine';
import { color, radius, accentOnWhite, accentSolid } from '@/theme/tokens';
import { clockParts, durationLabel, hourLabel, limitWord, speed, type SpeedUnit } from '@/format';
import { Txt } from './Txt';
import { Card, VerdictPill } from './ui';
import { Compass } from './Compass';
import { ChevronRight, DropIcon, SunIcon, ThermometerIcon, WarningIcon } from './icons';

const cardTitle = { w: 'bold' as const, size: 15 };

export function WindFromCard({ direction, state }: { direction: { deg: number; abbr: string; name: string } | null; state: HourState }) {
  return (
    <Card style={{ flex: 1, gap: 10 }}>
      <Txt {...cardTitle}>Wind from</Txt>
      {direction ? (
        <Compass deg={direction.deg} abbr={direction.abbr} accent={accentSolid(state)} label={`Compass: wind from ${direction.abbr}, ${direction.deg} degrees`} />
      ) : (
        <View style={{ width: 104, height: 104, borderRadius: 52, borderWidth: 2, borderStyle: 'dashed', borderColor: color.unknownOutline, alignItems: 'center', justifyContent: 'center' }}>
          <Txt w="display" size={28} c={color.textMuted}>?</Txt>
        </View>
      )}
      <Txt w="semibold" size={13}>
        {direction ? `${direction.name}, ${direction.deg}°` : 'Direction unknown'}
      </Txt>
    </Card>
  );
}

export function PeakGustCard({ peak, unit }: { peak: HourResult | null; unit: SpeedUnit }) {
  return (
    <Card style={{ flex: 1, gap: 6 }}>
      <Txt {...cardTitle}>Peak gust today</Txt>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Txt w="display" size={56} lh={60}>
          {peak?.gust != null ? speed(peak.gust, unit) : '?'}
        </Txt>
        <Txt w="semibold" size={14}>
          {unit === 'kn' ? 'kn' : 'mph'}
        </Txt>
      </View>
      <VerdictPill small state={peak?.state ?? 'UNKNOWN'} label={limitWord(peak?.state ?? 'UNKNOWN')} />
      <View style={{ flex: 1 }} />
      <Txt w="semibold" size={13}>
        {peak ? `Around ${hourLabel(peak.hour)}` : 'No forecast'}
      </Txt>
    </Card>
  );
}

/** Ink block, three columns: white line icon, value, label. Secondary readings. Unknown shows "?". */
export function DarkBlock({
  humidityPct,
  uvIndex,
  tempF,
  feelsLikeF,
}: {
  humidityPct: number | null;
  uvIndex: number | null;
  tempF: number | null;
  feelsLikeF: number | null;
}) {
  const uv = uvIndex == null ? null : Math.round(uvIndex);
  const uvWord = uv == null ? '' : uv <= 2 ? 'Low' : uv <= 5 ? 'Moderate' : uv <= 7 ? 'High' : 'Very high';
  const cols = [
    { icon: <DropIcon />, value: humidityPct == null ? '?' : `${Math.round(humidityPct)}%`, label: 'Humidity' },
    { icon: <SunIcon />, value: uv == null ? '?' : `${uv} ${uvWord}`, label: 'UV index' },
    {
      icon: <ThermometerIcon />,
      value: tempF == null ? '?' : `${Math.round(tempF)}°F`,
      label: feelsLikeF == null ? 'Feels like ?' : `Feels like ${Math.round(feelsLikeF)}°`,
    },
  ];
  return (
    <View style={{ backgroundColor: color.ink, borderRadius: radius.card, paddingVertical: 18, paddingHorizontal: 12, flexDirection: 'row' }}>
      {cols.map((c) => (
        <View key={c.label} accessible accessibilityLabel={`${c.label}: ${c.value === '?' ? 'unknown' : c.value}`} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          {c.icon}
          <Txt w="display" size={20} lh={22} c={color.card}>
            {c.value}
          </Txt>
          <Txt w="semibold" size={12} c={color.onDarkMuted}>
            {c.label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

export interface RainDay {
  label: string;
  chancePct: number | null;
  amountIn: number | null;
}

/** Soft grey tiles. Unknown is a dashed outline with "?": never a guess. */
export function RainCard({ days, state }: { days: RainDay[]; state: HourState }) {
  const accent = accentOnWhite(state);
  return (
    <Card style={{ paddingHorizontal: 18, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt {...cardTitle}>Rain, next days</Txt>
        <Txt size={13} c={color.textMuted}>
          Chance and amount
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {days.map((d) => {
          const unknown = d.chancePct == null;
          return (
            <View
              key={d.label}
              accessible
              accessibilityLabel={unknown ? `${d.label}: rain unknown` : `${d.label}: ${d.chancePct}% chance, ${d.amountIn ?? 'unknown'} inches`}
              style={{
                flex: 1,
                backgroundColor: unknown ? 'transparent' : color.tile,
                borderWidth: unknown ? 2 : 0,
                borderStyle: 'dashed',
                borderColor: color.unknownOutline,
                borderRadius: radius.tile,
                paddingVertical: unknown ? 10 : 12,
                paddingHorizontal: 8,
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Txt w="bold" size={13}>
                {d.label}
              </Txt>
              <Txt w="display" size={20} lh={22} c={unknown ? color.textMuted : color.ink}>
                {unknown ? '?' : `${d.chancePct}%`}
              </Txt>
              {unknown ? null : (
                <View style={{ width: '100%', height: 6, borderRadius: radius.pill, backgroundColor: color.track }}>
                  <View style={{ width: `${d.chancePct}%`, height: 6, borderRadius: radius.pill, backgroundColor: accent }} />
                </View>
              )}
              <Txt w="semibold" size={11} c={color.textMuted}>
                {unknown ? 'Unknown' : d.amountIn == null ? '? in' : `${d.amountIn} in`}
              </Txt>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const ARC = { cx: 157, cy: 110, rx: 137, ry: 96 };

/** A flattened arc with the elapsed part in the accent, a sun marker, sunrise and sunset below. */
export function DaylightCard({ sunrise, sunset, now, state }: { sunrise: number | null; sunset: number | null; now: number; state: HourState }) {
  const accent = accentOnWhite(state);
  const marker = accentSolid(state);
  if (sunrise == null || sunset == null) {
    return (
      <Card style={{ paddingHorizontal: 18, gap: 8 }}>
        <Txt {...cardTitle}>Daylight</Txt>
        <Txt size={13} c={color.textMuted}>
          Sunrise and sunset unknown for this place.
        </Txt>
      </Card>
    );
  }
  const f = Math.max(0, Math.min(1, (now - sunrise) / (sunset - sunrise)));
  const theta = Math.PI * (1 - f);
  const x = ARC.cx + ARC.rx * Math.cos(theta);
  const y = ARC.cy - ARC.ry * Math.sin(theta);
  const left = sunset - now;
  const rise = clockParts(sunrise);
  const set = clockParts(sunset);
  return (
    <Card style={{ paddingHorizontal: 18, gap: 8 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt {...cardTitle}>Daylight</Txt>
        <Txt size={13} c={color.textMuted}>
          {left > 0 ? `${durationLabel(left)} left` : 'After sunset'}
        </Txt>
      </View>
      <View style={{ alignItems: 'center' }}>
        <Svg
          width="100%"
          height={124}
          viewBox="0 0 314 124"
          fill="none"
          accessibilityRole="image"
          accessibilityLabel={`Sun path from sunrise to sunset, ${Math.round(f * 100)}% of daylight gone`}
          style={{ maxWidth: 314 }}
        >
          <Path d="M20 110A137 96 0 0 1 294 110" stroke={color.track} strokeWidth={6} strokeLinecap="round" strokeDasharray="2 12" />
          {f > 0 ? <Path d={`M20 110A137 96 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`} stroke={accent} strokeWidth={6} strokeLinecap="round" /> : null}
          <Path d="M4 110H310" stroke={color.ink} strokeWidth={3} strokeLinecap="round" />
          <Circle cx={x} cy={y} r={13} fill={marker} stroke={color.ink} strokeWidth={4} />
        </Svg>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ gap: 2 }}>
          <Txt size={12} c={color.textMuted}>
            Sunrise
          </Txt>
          <Txt w="display" size={20}>
            {rise.time}{' '}
            <Txt w="semibold" size={12}>
              {rise.meridiem}
            </Txt>
          </Txt>
        </View>
        <View style={{ gap: 2, alignItems: 'flex-end' }}>
          <Txt size={12} c={color.textMuted}>
            Sunset
          </Txt>
          <Txt w="display" size={20}>
            {set.time}{' '}
            <Txt w="semibold" size={12}>
              {set.meridiem}
            </Txt>
          </Txt>
        </View>
      </View>
    </Card>
  );
}

/** White card: title, one line of detail; on the right a coloured pill and a one-word verdict. */
export function StatusRow({ title, detail, state, value, word }: { title: string; detail: string; state: HourState; value: string; word: string }) {
  return (
    <Card style={{ paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 3 }}>
        <Txt w="bold" size={17}>
          {title}
        </Txt>
        <Txt size={13} c={color.textMuted}>
          {detail}
        </Txt>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <VerdictPill big state={state} label={value} />
        <Txt w="semibold" size={13}>
          {word}
        </Txt>
      </View>
    </Card>
  );
}

/** Ink card under the hero, only when an official alert is active. */
export function AlertBanner({ event, detail, onPress }: { event: string; detail: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event}. ${detail}`}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: color.ink,
        borderRadius: radius.card,
        paddingVertical: 14,
        paddingHorizontal: 16,
        minHeight: 64,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <WarningIcon />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt w="display" size={17} c={color.card}>
          {event}
        </Txt>
        <Txt size={13} lh={18} c={color.card}>
          {detail}
        </Txt>
      </View>
      <ChevronRight />
    </Pressable>
  );
}

/** Summary / Hourly / Raw data. The active segment is an ink pill. */
export function Segmented<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <View accessibilityRole="tablist" style={{ backgroundColor: color.track, borderRadius: radius.pill, padding: 4, flexDirection: 'row', gap: 4 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o)}
            style={{ flex: 1, minHeight: 44, borderRadius: radius.pill, backgroundColor: active ? color.ink : 'transparent', alignItems: 'center', justifyContent: 'center' }}
          >
            <Txt w={active ? 'bold' : 'semibold'} size={14} c={active ? color.card : color.ink}>
              {o}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
