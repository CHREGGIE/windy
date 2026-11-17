import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useNow } from '@/data/useNow';
import { Hero } from '@/components/Hero';
import { AlertBanner, DaylightCard, DarkBlock, PeakGustCard, RainCard, Segmented, StatusRow, WindFromCard } from '@/components/NowCards';
import { HourlyCard } from '@/components/Hourly';
import { RawData } from '@/components/RawData';
import { Disclaimer, PrimaryButton } from '@/components/ui';
import { color, size, space } from '@/theme/tokens';
import { hourLabel } from '@/format';
import { Txt } from '@/components/Txt';

const SEGMENTS = ['Summary', 'Hourly', 'Raw data'] as const;
type Segment = (typeof SEGMENTS)[number];

/** Now, version 2 (boards 10, 13 and 14). */
export default function NowScreen() {
  const m = useNow();
  const [segment, setSegment] = useState<Segment>('Summary');
  const unit = m.activity.unit;

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: size.buttonPrimary + 32 }}>
        <Hero
          state={m.state}
          gustMph={m.current?.gust ?? null}
          steadyMph={m.steadyMph}
          limitMph={m.settings.limitMph}
          unit={unit}
          line={m.line}
          pillLabel={`${m.activity.short} · ${m.place.short}`}
          onPillPress={() => router.push('/activities')}
        />

        <View style={{ paddingTop: 16, paddingHorizontal: space.screen, paddingBottom: 24, gap: space.cardGap }}>
          {m.alerts.map((a) => (
            <AlertBanner
              key={a.event}
              event={a.event}
              detail={a.detail}
              onPress={() => Alert.alert(a.event, `${a.detail}\n\nAn active wind alert keeps the verdict at caution or worse.`)}
            />
          ))}

          <Segmented options={SEGMENTS} value={segment} onChange={setSegment} />

          {m.lowConfidence ? (
            <View accessible style={{ backgroundColor: color.card, borderRadius: 16, padding: 14 }}>
              <Txt w="bold" size={15}>
                Low confidence
              </Txt>
              <Txt size={13} c={color.textMuted}>
                Forecasts disagree by more than 5 mph. The higher one is used.
              </Txt>
            </View>
          ) : null}

          {segment === 'Summary' ? (
            <>
              <View style={{ flexDirection: 'row', gap: space.cardGap }}>
                <WindFromCard deg={m.direction.deg} abbr={m.direction.abbr} name={m.direction.name} state={m.state} />
                <PeakGustCard peak={m.peak} unit={unit} />
              </View>
              <DarkBlock {...m.current10m} />
              <RainCard state={m.state} days={m.days.map((d) => ({ label: d.label, chancePct: d.rainChancePct, amountIn: d.rainAmountIn }))} />
              <DaylightCard sunrise={m.sun.sunrise} sunset={m.sun.sunset} now={m.sun.nowMinutes} state={m.state} />
              {m.lightning.state === 'none' ? (
                <StatusRow title="Lightning" detail={m.lightning.detail} state="GO" value="None" word="Clear" />
              ) : m.lightning.state === 'possible' ? (
                <StatusRow title="Lightning" detail={m.lightning.detail} state="CAUTION" value="Watch" word="Possible" />
              ) : (
                <StatusRow title="Lightning" detail={m.lightning.detail} state="UNKNOWN" value="?" word="Unknown" />
              )}
            </>
          ) : null}

          {segment === 'Hourly' ? (
            <HourlyCard
              title="Today, working hours"
              subtitle={`${hourLabel(m.activity.workStart)} to ${hourLabel(m.activity.workEnd)}`}
              hours={m.hours}
              limitMph={m.settings.limitMph}
              unit={unit}
              nowHour={m.nowHour}
            />
          ) : null}

          {segment === 'Raw data' ? <RawData m={m} /> : null}

          <Disclaimer sample={m.isSample} />
        </View>
      </ScrollView>

      <View pointerEvents="box-none" style={{ position: 'absolute', left: space.screen, right: space.screen, bottom: 16 }}>
        <PrimaryButton
          label="Text me if this changes"
          onPress={() => Alert.alert('Not set up yet', 'Text messages are not connected in this build. You will be able to turn them on here.')}
        />
      </View>
    </View>
  );
}
