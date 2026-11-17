import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CAUTION_FRACTION } from '@windcheck/engine';
import { activity } from '@/data/catalog';
import { defaultSettings, useAppState } from '@/state/AppState';
import { Txt } from '@/components/Txt';
import { Card, DISCLAIMER, PrimaryButton, ScreenHeader, TextButton } from '@/components/ui';
import { Stepper, SwitchRow } from '@/components/Controls';
import { color, radius, scale, space } from '@/theme/tokens';
import { limitDisplay, limitFromDisplay } from '@/format';

const HEIGHT_STEP_FT = 5;

/** Board 12, "Your limits". One machine per activity, as the design assumes. */
export default function Limits() {
  const insets = useSafeAreaInsets();
  const { activityId, settings, saveSettings } = useAppState();
  const a = activity(activityId);
  const [s, setS] = useState(settings[activityId]);
  const unit = a.unit;
  const u = unit === 'kn' ? 'kn' : 'mph';
  const limit = limitDisplay(s.limitMph, unit);
  const caution = Math.round(limit * CAUTION_FRACTION);
  const max = Math.max(limitDisplay(scale.windMaxMph, unit), Math.ceil((limit + 5) / 10) * 10);
  const pct = (v: number) => (v / max) * 100;

  const setLimit = (display: number) => setS({ ...s, limitMph: limitFromDisplay(Math.max(1, Math.min(99, display)), unit) });
  const setHeight = (ft: number) => setS({ ...s, heightFt: Math.max(0, Math.min(1000, ft)) });

  return (
    <ScrollView style={{ backgroundColor: color.background }} contentContainerStyle={{ paddingTop: 24 + insets.top, paddingHorizontal: space.screen, paddingBottom: 24 + insets.bottom, gap: 14 }}>
      <ScreenHeader title="Your limits" subtitle={[a.name, a.machine].filter(Boolean).join(' · ')} />

      <Card style={{ padding: 18, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 2 }}>
            <Txt w="bold" size={15}>
              Stop when gusts reach
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }} accessible accessibilityLabel={`Gust limit ${limit} ${u}`}>
              <Txt w="display" size={56} lh={60}>
                {limit}
              </Txt>
              <Txt w="semibold" size={15}>
                {u}
              </Txt>
            </View>
          </View>
          <Stepper what="gust limit" onMinus={() => setLimit(limit - 1)} onPlus={() => setLimit(limit + 1)} />
        </View>
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel={`Scale from 0 to ${max} ${u}: go up to ${caution}, caution from ${caution} to ${limit}, no-go above ${limit}`}
          style={{ gap: 6 }}
        >
          <View style={{ flexDirection: 'row', height: 18, borderRadius: radius.pill, overflow: 'hidden' }}>
            <View style={{ width: `${pct(caution)}%`, backgroundColor: color.go }} />
            <View style={{ width: `${pct(limit) - pct(caution)}%`, backgroundColor: color.caution }} />
            <View style={{ flex: 1, backgroundColor: color.nogo }} />
          </View>
          <View style={{ height: 16 }}>
            {[
              { v: 0, left: 0 },
              { v: caution, left: pct(caution) },
              { v: limit, left: pct(limit) },
            ].map((t) => (
              <Txt
                key={t.v}
                w="bold"
                size={12}
                style={{ position: 'absolute', left: `${t.left}%`, width: 30, marginLeft: t.v === 0 ? 0 : -15, textAlign: t.v === 0 ? 'left' : 'center' }}
              >
                {t.v}
              </Txt>
            ))}
            <Txt w="bold" size={12} style={{ position: 'absolute', right: 0 }}>
              {max}
            </Txt>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 4 }}>
            <Txt w="semibold" size={13}>
              Go below {caution}
            </Txt>
            <Txt w="semibold" size={13}>
              Caution {caution} to {limit}
            </Txt>
            <Txt w="semibold" size={13}>
              No-go above {limit}
            </Txt>
          </View>
        </View>
        <Txt size={13} lh={18} c={color.textMuted}>
          Caution starts at 80% of your limit. Use the number in your equipment manual.
        </Txt>
      </Card>

      {a.heightLabel ? (
        <Card style={{ padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Txt w="bold" size={15}>
              Working height
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }} accessible accessibilityLabel={`Working height ${s.heightFt} feet`}>
              <Txt w="display" size={40} lh={44}>
                {s.heightFt}
              </Txt>
              <Txt w="semibold" size={15}>
                ft
              </Txt>
            </View>
            <Txt size={13} c={color.textMuted}>
              Wind is stronger up there, so we adjust for it.
            </Txt>
          </View>
          <Stepper what="working height" onMinus={() => setHeight(s.heightFt - HEIGHT_STEP_FT)} onPlus={() => setHeight(s.heightFt + HEIGHT_STEP_FT)} />
        </Card>
      ) : null}

      <Card style={{ paddingVertical: 8, paddingHorizontal: 18 }}>
        <SwitchRow
          title="Lightning nearby"
          detail="No-go if storms are forecast"
          value={s.rules.lightning}
          onChange={(v) => setS({ ...s, rules: { ...s.rules, lightning: v } })}
        />
        <SwitchRow title="Rain" detail="Caution above a 50% chance" value={s.rules.rain} onChange={(v) => setS({ ...s, rules: { ...s.rules, rain: v } })} />
        <SwitchRow
          last
          title="Freezing temperatures"
          detail="Caution below 32°F"
          value={s.rules.freezing}
          onChange={(v) => setS({ ...s, rules: { ...s.rules, freezing: v } })}
        />
      </Card>

      <Card style={{ paddingVertical: 8, paddingHorizontal: 18 }}>
        <SwitchRow title="Evening text" detail="Tomorrow’s verdict at 6:00 PM" value={s.eveningText} onChange={(v) => setS({ ...s, eveningText: v })} />
        <SwitchRow last title="Change text" detail="Only if the verdict changes" value={s.changeText} onChange={(v) => setS({ ...s, changeText: v })} />
      </Card>

      <Txt size={13} lh={18} c={color.textMuted}>
        {DISCLAIMER}
      </Txt>

      <View style={{ gap: 8, marginTop: 8 }}>
        <PrimaryButton
          label="Save limits"
          onPress={() => {
            saveSettings(activityId, s);
            router.canGoBack() ? router.back() : router.replace('/now');
          }}
        />
        <TextButton label="Reset to defaults" onPress={() => setS(defaultSettings(activityId))} />
      </View>
    </ScrollView>
  );
}
