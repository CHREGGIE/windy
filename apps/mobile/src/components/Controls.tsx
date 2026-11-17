import { Pressable, View } from 'react-native';
import { color, extra, radius } from '@/theme/tokens';
import { Txt } from './Txt';
import { MinusIcon, PlusIcon } from './icons';

/** Minus and plus, 48 px round tiles (Limits board). */
export function Stepper({ what, onMinus, onPlus }: { what: string; onMinus: () => void; onPlus: () => void }) {
  const btn = { backgroundColor: color.tile, width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Lower ${what}`} onPress={onMinus} style={btn}>
        <MinusIcon />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Raise ${what}`} onPress={onPlus} style={btn}>
        <PlusIcon />
      </Pressable>
    </View>
  );
}

/** Title, detail and an ink switch. Rows are divided by a hairline. */
export function SwitchRow({ title, detail, value, onChange, last }: { title: string; detail: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: color.hairline,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Txt w="bold" size={15}>
          {title}
        </Txt>
        <Txt size={13} c={color.textMuted}>
          {detail}
        </Txt>
      </View>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={title}
        accessibilityState={{ checked: value }}
        onPress={() => onChange(!value)}
        style={{ width: 56, height: 44, justifyContent: 'center' }}
      >
        <View style={{ width: 56, height: 32, borderRadius: radius.pill, backgroundColor: value ? color.ink : extra.switchOff }}>
          <View style={{ position: 'absolute', top: 4, left: value ? 28 : 4, width: 24, height: 24, borderRadius: radius.pill, backgroundColor: color.card }} />
        </View>
      </Pressable>
    </View>
  );
}
