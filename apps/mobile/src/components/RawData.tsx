import { Alert, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import type { NowModel } from '@/data/now';
import { color, radius } from '@/theme/tokens';
import { clockLabel, speed } from '@/format';
import { Txt } from './Txt';
import { PrimaryButton } from './ui';

type Row = [label: string, value: string];

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <View style={{ backgroundColor: color.card, borderRadius: radius.card, paddingTop: 6, paddingHorizontal: 18, paddingBottom: 2 }}>
      <Txt w="bold" size={13} style={{ paddingTop: 12 }} accessibilityRole="header">
        {title}
      </Txt>
      {rows.map(([k, v], i) => (
        <View
          key={k}
          accessible
          accessibilityLabel={`${k}: ${v}`}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 12,
            paddingVertical: 11,
            borderBottomWidth: i === rows.length - 1 ? 0 : 1,
            borderBottomColor: color.hairline,
          }}
        >
          <Txt size={14} c={color.textMuted} style={{ flexShrink: 1 }}>
            {k}
          </Txt>
          <Txt w="bold" size={14} align="right" style={{ flexShrink: 1, fontVariant: ['tabular-nums'] }}>
            {v}
          </Txt>
        </View>
      ))}
    </View>
  );
}

const FT_10M = 33;

function ago(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  return `${Math.round(min / 60)} h ago`;
}

const n = (v: number | null | undefined, f: (x: number) => string) => (v == null ? 'Unknown' : f(v));

/** Sources, readings and derivation: the transparency differentiator. */
export function RawData({ m }: { m: NowModel }) {
  const unit = m.activity.unit;
  const u = unit === 'kn' ? 'kn' : 'mph';
  const f = m.forecast;
  const r = f.current;
  const w = m.worst;
  const height = Math.max(Math.round(m.settings.heightFt), FT_10M);
  const today = m.days[0];
  const per = m.current?.sources ?? [];

  const sources: Row[] = [
    ['Forecast sources', f.sourceNames.join(', ') || 'None'],
    ...(f.kind === 'sample' ? ([['Note', 'Sample data, not live']] as Row[]) : []),
    ['Place', `${m.place.lat.toFixed(4)}, ${m.place.lon.toFixed(4)}`],
    ['NWS grid cell', f.grid ?? 'Not available'],
    ['Last update', f.fetchedAt ? `${clockLabel(f.now.minutes)}, ${ago(Date.now() - f.fetchedAt)}` : `${clockLabel(f.now.minutes)}, sample clock`],
    ...f.errors.map((e, i): Row => [i === 0 ? 'Problems' : ' ', e]),
  ];
  const readings: Row[] = [
    ...per.map((s): Row => [`${s.source}: wind / gust at 33 ft`, `${speed(s.wind10, unit)} / ${speed(s.gust10, unit)} ${u}`]),
    [`Gust at ${height} ft, calculated`, m.current?.gust != null ? `${speed(m.current.gust, unit)} ${u}` : 'Unknown'],
    ['Sources disagree by', per.length > 1 && m.current ? `${m.current.spread} mph${m.current.spread > 5 ? ', low confidence' : ''}` : 'Only one source'],
    ['Wind direction', m.direction ? `${m.direction.deg}° (${m.direction.abbr})` : 'Unknown'],
    ['Temperature', n(r?.tempF, (x) => `${Math.round(x)}°F`)],
    ['Feels like', n(r?.feelsLikeF, (x) => `${Math.round(x)}°F`)],
    ['Humidity', n(r?.humidityPct, (x) => `${Math.round(x)}%`)],
    ['Dew point', n(r?.dewPointF, (x) => `${Math.round(x)}°F`)],
    ['Pressure', n(r?.pressureInHg, (x) => `${x.toFixed(2)} inHg`)],
    ['UV index', n(r?.uvIndex, (x) => `${Math.round(x)}`)],
    ['Thunder chance', n(r?.thunderPct, (x) => `${Math.round(x)}%`)],
    ['Rain chance today', n(today?.rainChancePct, (x) => `${x}%`)],
    ['Rain amount today', n(today?.rainAmountIn, (x) => `${x.toFixed(2)} in`)],
    ['Sunrise / sunset', m.sun.sunrise != null && m.sun.sunset != null ? `${clockLabel(m.sun.sunrise)} / ${clockLabel(m.sun.sunset)}` : 'Unknown'],
  ];

  const how =
    w && m.current?.gust != null
      ? m.settings.heightFt * 0.3048 <= 10
        ? `${speed(w.gust10, unit)} ${u} gust at 33 ft from ${w.source}. Your working height is at or below 33 ft, so no height adjustment.`
        : `${speed(w.gust10, unit)} ${u} gust at 33 ft from ${w.source}, multiplied by ${w.factor.toFixed(2)} for ${height} ft, gives ${speed(m.current.gust, unit)} ${u}. ` +
          (w.alpha === 0.2 ? 'Standard wind-shear exponent 0.20.' : `Shear exponent ${w.alpha.toFixed(2)} from this source's 80 m wind.`) +
          (per.length > 1 ? ' The higher of the sources is used.' : '')
      : 'No source has data for this hour, so there is nothing to derive. The verdict is Unknown.';

  const copy = async () => {
    const text = [...sources, ...readings].map(([k, v]) => `${k}: ${v}`).join('\n');
    await Clipboard.setStringAsync(`${m.place.name}\n${text}\n${how}`);
    Alert.alert('Copied', 'Readings copied to the clipboard.');
  };

  return (
    <View style={{ gap: 12 }}>
      <Section title="Where it comes from" rows={sources} />
      <Section title="This hour" rows={readings} />
      <View style={{ backgroundColor: color.ink, borderRadius: radius.card, paddingVertical: 16, paddingHorizontal: 18, gap: 6 }}>
        <Txt w="bold" size={13} c={color.card}>
          How we got {m.current?.gust != null ? `${speed(m.current.gust, unit)} ${u}` : 'this'}
        </Txt>
        <Txt size={14} lh={20} c={color.card}>
          {how}
        </Txt>
      </View>
      <PrimaryButton light label="Copy readings" onPress={copy} />
    </View>
  );
}
