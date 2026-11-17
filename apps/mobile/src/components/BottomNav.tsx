import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { color, radius } from '@/theme/tokens';
import { Txt } from './Txt';
import { ForecastIcon, MapIcon, NowIcon, PlacesIcon } from './icons';

const ICONS = { now: NowIcon, forecast: ForecastIcon, map: MapIcon, places: PlacesIcon } as const;
const LABELS = { now: 'Now', forecast: 'Forecast', map: 'Map', places: 'Places' } as const;

/** Four destinations. Android style: an ink pill behind the active icon. */
export function BottomNav({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      aria-label="Main"
      style={{
        backgroundColor: color.card,
        borderTopWidth: 1,
        borderTopColor: color.navBorder,
        paddingTop: 10,
        paddingHorizontal: 12,
        paddingBottom: 14 + insets.bottom,
        flexDirection: 'row',
        justifyContent: 'space-around',
      }}
    >
      {state.routes.map((route, index) => {
        const name = route.name as keyof typeof ICONS;
        const Icon = ICONS[name];
        if (!Icon) return null;
        const active = state.index === index;
        const onPress = () => {
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigateToTab(route.key);
        };
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={LABELS[name]}
            onPress={onPress}
            style={{ alignItems: 'center', gap: 4, minWidth: 72, minHeight: 56 }}
          >
            <View
              style={{
                width: 56,
                height: 30,
                borderRadius: radius.pill,
                backgroundColor: active ? color.ink : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon stroke={active ? color.card : color.textMuted} />
            </View>
            <Txt w={active ? 'bold' : 'semibold'} size={12} c={active ? color.ink : color.textMuted}>
              {LABELS[name]}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
