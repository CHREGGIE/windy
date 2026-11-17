import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { locateMe, searchPlaces, type SearchResult } from '@/data/location';
import { HERE_ID, newPlaceId, shortName, type SavedPlace } from '@/data/places';
import { color, font, radius } from '@/theme/tokens';
import { Txt } from './Txt';
import { MapIcon } from './icons';
import { Card, PrimaryButton } from './ui';

const inputStyle = {
  backgroundColor: color.card,
  borderRadius: radius.tile,
  minHeight: 52,
  paddingHorizontal: 16,
  fontFamily: font.medium,
  fontSize: 16,
  color: color.ink,
  borderWidth: 2,
  borderColor: color.card,
} as const;

/**
 * Add a place two ways: where you are now, or search for where you will be.
 * Calls `onSaved` with the new place; the caller decides where to go next.
 */
export function AddPlaceForm({ onSaved }: { onSaved: (p: SavedPlace) => void }) {
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<SearchResult | null>(null);
  const [name, setName] = useState('');
  const seq = useRef(0);

  // Search as the user types, after a short pause.
  useEffect(() => {
    setPicked(null);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const id = ++seq.current;
    setSearching(true);
    const t = setTimeout(() => {
      searchPlaces(query).then((r) => {
        if (id !== seq.current) return;
        setResults(r);
        setSearching(false);
      });
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const useHere = async () => {
    setLocating(true);
    setLocError(null);
    const r = await locateMe();
    setLocating(false);
    if (!r.ok) {
      setLocError(r.message);
      return;
    }
    onSaved({ id: HERE_ID, name: r.name, short: 'Here', lat: r.lat, lon: r.lon, kind: 'here' });
  };

  const save = () => {
    if (!picked) return;
    const n = name.trim() || picked.name;
    onSaved({ id: newPlaceId(), name: n, short: shortName(n), lat: picked.lat, lon: picked.lon, kind: 'saved' });
  };

  return (
    <View style={{ gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        onPress={useHere}
        disabled={locating}
        style={({ pressed }) => ({
          backgroundColor: color.ink,
          borderRadius: radius.card,
          padding: 16,
          minHeight: 64,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          opacity: pressed ? 0.9 : 1,
        })}
      >
        {locating ? <ActivityIndicator color={color.card} /> : <MapIcon size={26} stroke={color.card} />}
        <View style={{ flex: 1, gap: 2 }}>
          <Txt w="display" size={17} c={color.card}>
            Use where I am now
          </Txt>
          <Txt size={13} c={color.onDarkMuted}>
            Only used to get the forecast. Never sold or shared.
          </Txt>
        </View>
      </Pressable>
      {locError ? (
        <Txt size={13} lh={18} c={color.textMuted} accessibilityLiveRegion="polite">
          {locError}
        </Txt>
      ) : null}

      <Txt w="bold" size={15} style={{ marginTop: 8 }} accessibilityRole="header">
        Or where you will be
      </Txt>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Address, town or marina"
        placeholderTextColor={color.textMuted}
        accessibilityLabel="Search for a place"
        autoCorrect={false}
        returnKeyType="search"
        style={inputStyle}
      />
      {searching ? <ActivityIndicator color={color.ink} accessibilityLabel="Searching" /> : null}
      {!searching && query.trim().length >= 2 && results.length === 0 ? (
        <Txt size={13} c={color.textMuted}>
          Nothing found. Try a town name, or a full street address on your phone.
        </Txt>
      ) : null}

      {results.filter((r) => !picked || r.key === picked.key).map((r) => {
        const on = picked?.key === r.key;
        return (
          <Pressable
            key={r.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => {
              setPicked(r);
              setName(r.name);
            }}
            style={{
              backgroundColor: color.card,
              borderRadius: radius.card,
              paddingVertical: 12,
              paddingHorizontal: 16,
              minHeight: 52,
              borderWidth: 3,
              borderColor: on ? color.ink : color.card,
              gap: 2,
            }}
          >
            <Txt w="bold" size={16}>
              {r.name}
            </Txt>
            <Txt size={13} c={color.textMuted}>
              {r.detail}
            </Txt>
          </Pressable>
        );
      })}

      {picked ? (
        <Card style={{ gap: 10 }}>
          <Txt w="bold" size={15}>
            Name this place
          </Txt>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Red Hook yard"
            placeholderTextColor={color.textMuted}
            accessibilityLabel="Place name"
            style={{ ...inputStyle, backgroundColor: color.tile, borderColor: color.tile }}
          />
          <PrimaryButton label="Save place" onPress={save} />
        </Card>
      ) : null}
    </View>
  );
}
