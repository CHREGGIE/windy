/**
 * Design tokens. The single source of truth is design/tokens.json at the repo root;
 * this file only adds types and the font family names the app loads.
 */
import raw from '../../../../design/tokens.json';
import type { HourState } from '@windcheck/engine';

export const color = raw.color;
export const radius = raw.radius;
export const space = raw.space;
export const size = raw.size;
export const fontSize = raw.font.size;
export const scale = raw.scale;

/** Font family names registered by useFonts in the root layout. */
export const font = {
  display: 'ArchivoBlack_400Regular',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Two values not in tokens.json but used by the reference boards. */
export const extra = {
  /** Off-state switch track (Limits board). */
  switchOff: '#C9C7C0',
  /** Unselected onboarding progress segment and icon outline. */
  stepOff: '#D9D7D0',
  iconOff: '#8A8C96',
  /** Hourly row track (version 1 board). */
  hourlyTrack: '#EFEDE7',
} as const;

export interface HeroColors {
  background: string;
  text: string;
  barTrack: string;
  barFill: string;
  limitMarker: string;
}

/** Unknown is not a verdict colour: ink hero, white text (CLAUDE.md, colour means verdict). */
const unknownHero: HeroColors = {
  background: color.ink,
  text: color.card,
  barTrack: 'rgba(255,255,255,0.3)',
  barFill: color.card,
  limitMarker: color.caution,
};

export function heroColors(state: HourState): HeroColors {
  switch (state) {
    case 'GO':
      return color.hero.go;
    case 'CAUTION':
      return color.hero.caution;
    case 'NO-GO':
      return color.hero.nogo;
    default:
      return unknownHero;
  }
}

/** The verdict colour as a fill behind text, with the text colour that reads on it. */
export function verdictFill(state: HourState): { bg: string; fg: string } {
  switch (state) {
    case 'GO':
      return { bg: color.go, fg: color.card };
    case 'CAUTION':
      return { bg: color.caution, fg: color.ink };
    case 'NO-GO':
      return { bg: color.nogo, fg: color.card };
    default:
      return { bg: color.track, fg: color.ink };
  }
}

/** The screen accent for thin shapes on white (rain bars, daylight arc). Yellow is too weak there. */
export function accentOnWhite(state: HourState): string {
  switch (state) {
    case 'GO':
      return color.go;
    case 'CAUTION':
      return color.cautionOnWhite;
    case 'NO-GO':
      return color.nogo;
    default:
      return color.textMuted;
  }
}

/** The screen accent on ink or as a marker fill (compass marker, sun marker). */
export function accentSolid(state: HourState): string {
  switch (state) {
    case 'GO':
      return color.go;
    case 'CAUTION':
      return color.caution;
    case 'NO-GO':
      return color.nogo;
    default:
      return color.unknownOutline;
  }
}

/** Bars in hourly rows. */
export function barColor(state: HourState): string {
  switch (state) {
    case 'GO':
      return color.go;
    case 'CAUTION':
      return color.cautionBar;
    case 'NO-GO':
      return color.nogo;
    default:
      return color.unknownOutline;
  }
}
