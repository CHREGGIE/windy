import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { color, font } from '@/theme/tokens';

const C = 100;
const R = 83;

/** Ticks at the eight points: cardinal 14 long and 4 wide, diagonals 10 long and 3 wide. */
const TICKS = [0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
  const cardinal = deg % 90 === 0;
  const r1 = 90;
  const r2 = cardinal ? 76 : 80;
  const s = Math.sin((deg * Math.PI) / 180);
  const c = Math.cos((deg * Math.PI) / 180);
  const p = (r: number) => `${(C + r * s).toFixed(1)} ${(C - r * c).toFixed(1)}`;
  return { d: `M${p(r1)}L${p(r2)}`, w: cardinal ? 4 : 3 };
});

/**
 * Compass "B2", the chosen design: thick ink bezel, white ticks, and a round marker riding the bezel
 * at the bearing the wind comes FROM. No arrows or needles (rejected by the owner).
 */
export function Compass({ deg, abbr, accent, size = 104, label }: { deg: number; abbr: string; accent: string; size?: number; label: string }) {
  const s = Math.sin((deg * Math.PI) / 180);
  const c = Math.cos((deg * Math.PI) / 180);
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none" accessibilityRole="image" accessibilityLabel={label}>
      <Circle cx={C} cy={C} r={R} stroke={color.ink} strokeWidth={18} />
      {TICKS.map((t) => (
        <Path key={t.d} d={t.d} stroke={color.card} strokeWidth={t.w} strokeLinecap="round" />
      ))}
      <Circle cx={C + R * s} cy={C - R * c} r={15} fill={accent} stroke={color.card} strokeWidth={5} />
      <SvgText x={100} y={114} textAnchor="middle" fontFamily={font.display} fontSize={abbr.length > 2 ? 38 : 48} fill={color.ink}>
        {abbr}
      </SvgText>
    </Svg>
  );
}
