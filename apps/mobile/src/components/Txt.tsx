import { Text, type TextProps, type TextStyle } from 'react-native';
import { color, font } from '@/theme/tokens';

export type Weight = keyof typeof font;

export interface TxtProps extends TextProps {
  /** `display` is Archivo Black; the rest are Inter weights. */
  w?: Weight;
  size?: number;
  c?: string;
  lh?: number;
  align?: TextStyle['textAlign'];
}

/** All text in the app goes through this, so the two typefaces stay consistent. */
export function Txt({ w = 'regular', size = 15, c = color.ink, lh, align, style, ...rest }: TxtProps) {
  return (
    <Text
      allowFontScaling
      {...rest}
      style={[{ fontFamily: font[w], fontSize: size, color: c, lineHeight: lh, textAlign: align }, style]}
    />
  );
}
