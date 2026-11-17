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

const M_TO_FT_10M = 33;

/** Sources, readings and derivation: the transparency differentiator. */
export function RawData({ m }: { m: NowModel }) {
  const u = m.activity.unit === 'kn' ? 'kn' : 'mph';
  const w = m.current10m.worst;
  const height = Math.max(Math.round(m.settings.heightFt), M_TO_FT_10M);
  const today = m.days[0];
  const sources: Row[] = [
    ['Forecast source', 'Sample data, not live'],
    ['Sources combined', m.current10m.sourceCount > 0 ? `${m.current10m.sourceCount}, worse one used` : 'None'],
    ['Grid cell', 'Not looked up yet'],
    ['Last update', `${clockLabel(m.sun.nowMinutes)}, sample clock`],
  ];
  const spread = m.current?.spread;
  const readings: Row[] = [
    ['Wind speed at 33 ft', w ? `${speed(w.wind10, m.activity.unit)} ${u}` : 'Unknown'],
    ['Wind gust at 33 ft', w ? `${speed(w.gust10, m.activity.unit)} ${u}` : 'Unknown'],
    [`Gust at ${height} ft, calculated`, m.current?.gust != null ? `${speed(m.current.gust, m.activity.unit)} ${u}` : 'Unknown'],
    ['Sources disagree by', spread != null && m.current10m.sourceCount > 1 ? `${spread} mph${spread > 5 ? ', low confidence' : ''}` : 'Not applicable'],
    ['Wind direction', `${m.direction.deg}° (${m.direction.abbr})`],
    ['Temperature', `${m.current10m.tempF}°F`],
    ['Feels like', `${m.current10m.feelsLikeF}°F`],
    ['Humidity', `${m.current10m.humidityPct}%`],
    ['Dew point', `${m.current10m.dewPointF}°F`],
    ['Pressure', `${m.current10m.pressureInHg.toFixed(2)} inHg`],
    ['UV index', `${m.current10m.uvIndex}`],
    ['Rain chance', today?.rainChancePct != null ? `${today.rainChancePct}%` : 'Unknown'],
    ['Rain amount', today?.rainAmountIn != null ? `${today.rainAmountIn.toFixed(2)} in` : 'Unknown'],
    [
      'Sunrise / sunset',
      m.sun.sunrise != null && m.sun.sunset != null ? `${clockLabel(m.sun.sunrise)} / ${clockLabel(m.sun.sunset)}` : 'Unknown',
    ],
  ];

  const how =
    w && m.current?.gust != null
      ? m.settings.heightFt * 0.3048 <= 10
        ? `${speed(w.gust10, m.activity.unit)} ${u} gust at 33 ft. Your working height is at or below 33 ft, so no height adjustment.`
        : `${speed(w.gust10, m.activity.unit)} ${u} gust at 33 ft, multiplied by ${w.factor.toFixed(2)} for ${height} ft, gives ${speed(m.current.gust, m.activity.unit)} ${u}. ` +
          (w.alpha === 0.2 ? 'Standard wind-shear exponent 0.20.' : `Shear exponent ${w.alpha.toFixed(2)} from this source's 80 m wind.`)
      : 'No source has data for this hour, so there is nothing to derive. The verdict is Unknown.';

  const copy = async () => {
    const text = [...sources, ...readings].map(([k, v]) => `${k}: ${v}`).join('\n');
    await Clipboard.setStringAsync(`${m.place.name}\n${text}\n${how}`);
    Alert.alert('Copied', 'Readings copied to the clipboard.');
  };

  return (
    <View style={{ gap: 12 }}>
      <Section title="Where it comes from" rows={sources} />
      <Section title="Current readings" rows={readings} />
      <View style={{ backgroundColor: color.ink, borderRadius: radius.card, paddingVertical: 16, paddingHorizontal: 18, gap: 6 }}>
        <Txt w="bold" size={13} c={color.card}>
          How we got {m.current?.gust != null ? `${speed(m.current.gust, m.activity.unit)} ${u}` : 'this'}
        </Txt>
        <Txt size={14} lh={20} c={color.card}>
          {how}
        </Txt>
      </View>
      <PrimaryButton light label="Copy readings" onPress={copy} />
    </View>
  );
}
