import { View } from 'react-native';
import type { HourResult } from '@windcheck/engine';
import { barColor, color, extra, radius, scale } from '@/theme/tokens';
import { hourLabel, hourlyWord, speed, type SpeedUnit } from '@/format';
import { Txt } from './Txt';
import { Card } from './ui';

/**
 * Hourly rows (version 1 board): time, bar, value, verdict word, with a black line through every row
 * at the limit. The current hour is bold.
 */
export function HourlyCard({
  title,
  subtitle,
  hours,
  limitMph,
  unit,
  nowHour,
}: {
  title: string;
  subtitle?: string;
  hours: HourResult[];
  limitMph: number;
  unit: SpeedUnit;
  nowHour?: number;
}) {
  const max = Math.max(scale.windMaxMph, Math.ceil(Math.max(limitMph, ...hours.map((h) => h.gust ?? 0)) / 10) * 10);
  const limitPct = `${(limitMph / max) * 100}%` as const;
  const u = unit === 'kn' ? 'kn' : 'mph';
  return (
    <Card style={{ paddingHorizontal: 18, gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt w="bold" size={15}>
          {title}
        </Txt>
        {subtitle ? (
          <Txt size={13} c={color.textMuted}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {hours.length === 0 ? (
        <Txt size={13} c={color.textMuted}>
          No working hours set.
        </Txt>
      ) : null}
      {hours.map((h) => {
        const now = h.hour === nowHour;
        const unknown = h.gust == null;
        return (
          <View
            key={h.hour}
            accessible
            accessibilityLabel={`${hourLabel(h.hour)}${now ? ', now' : ''}: ${unknown ? 'unknown' : `${speed(h.gust!, unit)} ${u}`}, ${hourlyWord(h.state)}`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 26 }}
          >
            <Txt w={now ? 'bold' : 'medium'} size={13} style={{ width: 44 }}>
              {hourLabel(h.hour)}
            </Txt>
            <View style={{ flex: 1, height: 14, borderRadius: radius.pill, backgroundColor: extra.hourlyTrack }}>
              {unknown ? (
                <View style={{ flex: 1, borderRadius: radius.pill, borderWidth: 2, borderStyle: 'dashed', borderColor: color.unknownOutline }} />
              ) : (
                <View
                  style={{ width: `${Math.min(1, h.gust! / max) * 100}%`, height: 14, borderRadius: radius.pill, backgroundColor: barColor(h.state) }}
                />
              )}
              <View style={{ position: 'absolute', left: limitPct, top: -6, bottom: -6, width: 2, backgroundColor: color.ink }} />
            </View>
            <Txt w="display" size={15} align="right" style={{ width: 52 }}>
              {unknown ? '?' : speed(h.gust!, unit)}{' '}
              <Txt w="semibold" size={11}>
                {u}
              </Txt>
            </Txt>
            <Txt w={now ? 'bold' : 'semibold'} size={13} style={{ width: 76 }}>
              {hourlyWord(h.state)}
            </Txt>
          </View>
        );
      })}
    </Card>
  );
}
