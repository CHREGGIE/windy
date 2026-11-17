/** Line icons copied from the reference boards. All decorative: hidden from screen readers. */
import Svg, { Circle, Path } from 'react-native-svg';
import { color } from '@/theme/tokens';

interface IconProps {
  size?: number;
  stroke?: string;
  width?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  accessibilityElementsHidden: true,
  importantForAccessibility: 'no-hide-descendants' as const,
});

export function NowIcon({ size = 20, stroke = color.card, width = 2.4 }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={width}>
      <Path d="M3 8h10a3 3 0 1 0-3-3" />
      <Path d="M3 12h15" />
      <Path d="M3 16h9a3 3 0 1 1-3 3" />
    </Svg>
  );
}

export function ForecastIcon({ size = 20, stroke = color.textMuted, width = 2.4 }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={width}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </Svg>
  );
}

export function MapIcon({ size = 20, stroke = color.textMuted, width = 2.4 }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={width}>
      <Path d="M12 21s-6-5.7-6-10.5a6 6 0 0 1 12 0C18 15.3 12 21 12 21z" />
      <Circle cx={12} cy={10.5} r={2} />
    </Svg>
  );
}

export function PlacesIcon({ size = 20, stroke = color.textMuted, width = 2.4 }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={width}>
      <Path d="M6 4h12v16l-6-4-6 4z" />
    </Svg>
  );
}

export function BackIcon({ size = 20, stroke = color.ink }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={2.6}>
      <Path d="M15 5l-7 7 7 7" />
    </Svg>
  );
}

export function ChevronRight({ size = 18, stroke = color.card }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={2.6}>
      <Path d="M9 5l7 7-7 7" />
    </Svg>
  );
}

export function MinusIcon({ size = 20, stroke = color.ink }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={3}>
      <Path d="M5 12h14" />
    </Svg>
  );
}

export function PlusIcon({ size = 20, stroke = color.ink }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={3}>
      <Path d="M5 12h14M12 5v14" />
    </Svg>
  );
}

export function DropIcon({ size = 26, stroke = color.card }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={2.2}>
      <Path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />
    </Svg>
  );
}

export function SunIcon({ size = 26, stroke = color.card }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={2.2}>
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </Svg>
  );
}

export function ThermometerIcon({ size = 26, stroke = color.card }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={2.2}>
      <Path d="M10 4v10a4 4 0 1 0 4 0V4a2 2 0 0 0-4 0z" />
    </Svg>
  );
}

export function WarningIcon({ size = 28, stroke = color.caution }: IconProps) {
  return (
    <Svg {...base(size)} stroke={stroke} strokeWidth={2.4}>
      <Path d="M12 3l10 18H2z" />
      <Path d="M12 10v5" />
      <Path d="M12 18h.01" />
    </Svg>
  );
}

/** Onboarding choice: filled circle with a tick when picked, an outline when not. */
export function PickIcon({ picked, size = 22 }: { picked: boolean; size?: number }) {
  return picked ? (
    <Svg {...base(size)} stroke={color.card} strokeWidth={2.6}>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M7.5 12.5l3 3 6-6.5" />
    </Svg>
  ) : (
    <Svg {...base(size)} stroke="#8A8C96" strokeWidth={2.2}>
      <Circle cx={12} cy={12} r={10} />
    </Svg>
  );
}
