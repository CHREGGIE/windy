import { ActivityIndicator, ScrollView, View } from 'react-native';
import { windows } from '@windcheck/engine';
import { useAppState } from '@/state/AppState';
import { useNow } from '@/data/useNow';
import { dayVerdictLabel } from '@/data/now';
import { HourlyCard } from '@/components/Hourly';
import { StatusRow } from '@/components/NowCards';
import { TabHeader, UndesignedNote } from '@/components/TabHeader';
import { Card, Disclaimer } from '@/components/ui';
import { Txt } from '@/components/Txt';
import { color, space } from '@/theme/tokens';
import { hourLabel, speed, verdictWord } from '@/format';

/** Forecast tab. Not designed yet: today hour by hour, the best window, then one verdict per day. */
export default function ForecastScreen() {
  const { activityId, place } = useAppState();
  const { model: m, entry } = useNow();
  const pill = `${m?.activity.short ?? activityId} · ${place.short}`;

  if (!m) {
    return (
      <ScrollView style={{ backgroundColor: color.background }} contentContainerStyle={{ paddingHorizontal: space.screen, gap: space.cardGap }}>
        <TabHeader title="Forecast" pill={pill} />
        {entry.status === 'error' ? (
          <Txt size={15} c={color.textMuted}>No forecast right now. {entry.error}</Txt>
        ) : (
          <ActivityIndicator color={color.ink} accessibilityLabel="Loading forecast" />
        )}
      </ScrollView>
    );
  }

  const unit = m.activity.unit;
  const u = unit === 'kn' ? 'kn' : 'mph';
  const best = windows(m.hours)
    .filter((w) => w.state === 'GO' && w.end > m.nowHour)
    .sort((a, b) => b.end - b.start - (a.end - a.start))[0];

  return (
    <ScrollView style={{ backgroundColor: color.background }} contentContainerStyle={{ paddingHorizontal: space.screen, paddingBottom: 24, gap: space.cardGap }}>
      <TabHeader title="Forecast" pill={pill} />
      <UndesignedNote />

      <Card style={{ paddingHorizontal: 18, gap: 4 }}>
        <Txt w="bold" size={15}>
          Best working window left today
        </Txt>
        {best ? (
          <>
            <Txt w="display" size={24} lh={30}>
              {hourLabel(Math.max(best.start, m.nowHour))} to {hourLabel(best.end)}
            </Txt>
            <Txt size={13} c={color.textMuted}>
              Gusts {best.lo != null ? speed(best.lo, unit) : '?'} to {best.hi != null ? speed(best.hi, unit) : '?'} {u}, under your limit
            </Txt>
          </>
        ) : (
          <Txt size={13} c={color.textMuted}>
            No hours under your limit left today.
          </Txt>
        )}
      </Card>

      <HourlyCard title="Today hour by hour" hours={m.hours} limitMph={m.settings.limitMph} unit={unit} nowHour={m.nowHour} />

      <Txt w="bold" size={15} style={{ paddingTop: 6, paddingHorizontal: 4 }} accessibilityRole="header">
        Next days
      </Txt>
      {m.days.map((d) => {
        const state = d.verdict === 'PARTIAL' ? 'NO-GO' : d.verdict;
        return (
          <View key={d.date}>
            <StatusRow
              title={d.label}
              detail={d.peak?.gust != null ? `Peak gust ${speed(d.peak.gust, unit)} ${u} around ${hourLabel(d.peak.hour)}` : 'No forecast yet'}
              state={state}
              value={verdictWord(state)}
              word={dayVerdictLabel(d)}
            />
          </View>
        );
      })}
      <Disclaimer sample={m.isSample} />
    </ScrollView>
  );
}
