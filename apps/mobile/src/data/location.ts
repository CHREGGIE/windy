/**
 * Device location and place search. Location is read only when the user asks ("Use my location"),
 * used only to fetch the forecast, and never sold or shared (PRODUCT.md).
 */
import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type LocateResult =
  | { ok: true; lat: number; lon: number; name: string }
  | { ok: false; reason: 'denied' | 'off' | 'error'; message: string };

function addressName(a: Location.LocationGeocodedAddress | undefined): string | null {
  if (!a) return null;
  const street = [a.streetNumber, a.street].filter(Boolean).join(' ');
  return street || a.name || a.district || a.city || null;
}

async function reverseName(lat: number, lon: number): Promise<string | null> {
  if (Platform.OS === 'web') return null; // needs a Google key on web
  try {
    const [a] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    return addressName(a);
  } catch {
    return null;
  }
}

export async function locateMe(): Promise<LocateResult> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      return { ok: false, reason: 'denied', message: 'Location is off for WindCheck. You can still add places by searching.' };
    }
    if (Platform.OS !== 'web' && !(await Location.hasServicesEnabledAsync())) {
      return { ok: false, reason: 'off', message: 'Location services are turned off on this device.' };
    }
    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const { latitude: lat, longitude: lon } = pos.coords;
    return { ok: true, lat, lon, name: (await reverseName(lat, lon)) ?? 'Current location' };
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : 'Could not get your location.' };
  }
}

export interface SearchResult {
  key: string;
  name: string;
  detail: string;
  lat: number;
  lon: number;
}

/** Street addresses via the phone's own geocoder (Apple or Google, free, native only). */
async function deviceSearch(q: string): Promise<SearchResult[]> {
  if (Platform.OS === 'web') return [];
  try {
    const hits = (await Location.geocodeAsync(q)).slice(0, 3);
    return Promise.all(
      hits.map(async (h, i) => {
        const name = (await reverseName(h.latitude, h.longitude)) ?? q;
        return { key: `dev-${i}`, name, detail: `Address match · ${h.latitude.toFixed(4)}, ${h.longitude.toFixed(4)}`, lat: h.latitude, lon: h.longitude };
      }),
    );
  } catch {
    return [];
  }
}

/** Towns and places by name via Open-Meteo geocoding (free, works on web). Does not know street addresses. */
async function nameSearch(q: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en&format=json`);
    if (!res.ok) return [];
    const j = await res.json();
    return (j.results ?? []).map((r: any) => ({
      key: `om-${r.id}`,
      name: String(r.name),
      detail: [r.admin2, r.admin1, r.country].filter(Boolean).join(', '),
      lat: Number(r.latitude),
      lon: Number(r.longitude),
    }));
  } catch {
    return [];
  }
}

export async function searchPlaces(q: string): Promise<SearchResult[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const [dev, names] = await Promise.all([deviceSearch(query), nameSearch(query)]);
  return [...dev, ...names];
}
