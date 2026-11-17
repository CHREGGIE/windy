import { useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useAppState } from '@/state/AppState';
import { STALE_MS } from '@/state/ForecastStore';
import { useNow } from '@/data/useNow';
import { Hero } from '@/components/Hero';
import { AlertBanner, DaylightCard, DarkBlock, PeakGustCard, RainCard, Segmented, StatusRow, WindFromCard } from '@/components/NowCards';
import { HourlyCard } from '@/components/Hourly';
import { RawData } from '@/components/RawData';
import { Card, Disclaimer, PrimaryButton } from '@/components/ui';
import { Txt } from '@/components/Txt';
import { color, size, space } from '@/theme/tokens';
import { clockLabel, hourLabel } from '@/format';

const SEGMENTS = ['Summary', 'Hourly', 'Raw data'] as const;
type Segment = (typeof SEGMENTS)[number];

/** A plain notice card for loading, stale and failed states. Ink and grey only: these are not verdicts. */
function Notice({ title, detail, action }: { title: string; detail: string; action?: { label: string; onPress: () => void } }) {
  return (
    <Card style={{ gap: 4 }}>
      <Txt w="bold" size={15}>
        {title}
      </Txt>
      <Txt size={13} lh={18} c={color.textMuted}>
        {detail}
      </Txt>
      {action ? <PrimaryButton light label={action.label} onPress={action.onPress} style={{ marginTop: 8, borderWidth: 2, borderColor: color.ink }} /> : null}
    </Card>
  );
}

/** Now, version 2 (boards 10, 13 and 14), on live or example data. */
export default function NowScreen() {
  const { activityId, place, settings } = useAppState();
  const { model: m, entry, refresh } = useNow();
  const [segment, setSegment] = useState<Segment>('Summary');
  const pill = `${m?.activity.short ?? activityId} · ${place.short}`;
  const openPicker = () => router.push('/activities');

  if (!m) {
    // Loading, or every source failed with nothing cached: the verdict is Unknown, never Go.
    const failed = entry.status === 'error';
    return (
      <ScrollView style={{ flex: 1, backgroundColor: color.background }}>
        <Hero
          state="UNKNOWN"
          gustMph={null}
          steadyMph={null}
          limitMph={settings[activityId].limitMph}
          unit="mph"
          line={failed ? 'No forecast. Check on site.' : 'Getting the forecast…'}
          pillLabel={pill}
          onPillPress={openPicker}
        />
        <View style={{ padding: space.screen, gap: space.cardGap }}>
          {failed ? (
            <Notice
              title="No forecast right now"
              detail={`Neither forecast service answered, so the verdict is Unknown. ${entry.error ?? ''}`}
              action={{ label: 'Try again', onPress: refresh }}
            />
          ) : (
            <View style={{ paddingVertical: 24, alignItems: 'center' }}>
              <ActivityIndicator color={color.ink} accessibilityLabel="Loading forecast" />
            </View>
          )}
          <Disclaimer />
        </View>
      </ScrollView>
    );
  }

  const unit = m.activity.unit;
  const f = m.forecast;
  const stale = f.fetchedAt != null && Date.now() - f.fetchedAt > STALE_MS;

  return (
    <View style={{ flex: 1, backgroundColor: color.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: size.buttonPrimary + 32 }}
        refreshControl={f.kind === 'live' ? <RefreshControl refreshing={entry.loading} onRefresh={refresh} /> : undefined}
      >
        <Hero
          state={m.state}
          gustMph={m.current?.gust ?? null}
          steadyMph={m.steadyMph}
          limitMph={m.settings.limitMph}
          unit={unit}
          line={m.line}
          pillLabel={pill}
          onPillPress={openPicker}
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

          {stale || entry.error ? (
            <Notice
              title={stale ? `Forecast from ${clockLabel(f.now.minutes)}` : 'Could not update'}
              detail={
                stale
                  ? 'This forecast is more than 3 hours old. Pull down to refresh before you rely on it.'
                  : `Showing the last forecast. ${entry.error ?? ''}`
              }
              action={{ label: 'Refresh', onPress: refresh }}
            />
          ) : null}

          <Segmented options={SEGMENTS} value={segment} onChange={setSegment} />

          {m.lowConfidence ? (
            <Notice title="Low confidence" detail="Forecasts disagree by more than 5 mph in your working hours. The higher one is used." />
          ) : null}

          {segment === 'Summary' ? (
            <>
              <View style={{ flexDirection: 'row', gap: space.cardGap }}>
                <WindFromCard direction={m.direction} state={m.state} />
                <PeakGustCard peak={m.peak} unit={unit} />
              </View>
              <DarkBlock
                humidityPct={f.current?.humidityPct ?? null}
                uvIndex={f.current?.uvIndex ?? null}
                tempF={f.current?.tempF ?? null}
                feelsLikeF={f.current?.feelsLikeF ?? null}
              />
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
