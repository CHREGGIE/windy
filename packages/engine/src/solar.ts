/**
 * Sunrise and sunset from location and date (the sunrise equation, about a minute of accuracy).
 * DATA_SOURCES.md: "Sunrise, sunset — calculated from location and date. No feed needed."
 */

const RAD = Math.PI / 180;
const J2000 = 2451545;
const UNIX_EPOCH_JD = 2440587.5;

export interface SunTimes {
  /** Minutes after local midnight. Null during polar day or night. */
  sunrise: number | null;
  sunset: number | null;
}

/**
 * @param date Local calendar date, `YYYY-MM-DD`.
 * @param utcOffsetMinutes The place's UTC offset on that date, e.g. -300 for EST.
 */
export function sunTimes(date: string, lat: number, lon: number, utcOffsetMinutes: number): SunTimes {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const jdNoon = Date.UTC(y, m - 1, d, 12) / 86400000 + UNIX_EPOCH_JD;
  const n = Math.ceil(jdNoon - J2000 + 0.0008);
  const jStar = n - lon / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const transit = J2000 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);
  const sinDec = Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosW = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinDec) / (Math.cos(lat * RAD) * cosDec);
  if (cosW < -1 || cosW > 1) return { sunrise: null, sunset: null };
  const w = Math.acos(cosW) / RAD;
  const toLocalMinutes = (jd: number) => {
    const utcMs = (jd - UNIX_EPOCH_JD) * 86400000;
    const local = new Date(utcMs + utcOffsetMinutes * 60000);
    return local.getUTCHours() * 60 + local.getUTCMinutes() + local.getUTCSeconds() / 60;
  };
  return { sunrise: toLocalMinutes(transit - w / 360), sunset: toLocalMinutes(transit + w / 360) };
}
