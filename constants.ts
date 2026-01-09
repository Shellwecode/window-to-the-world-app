import { City } from './types';

export const CITIES: City[] = [
  { id: 'reykjavik', name: 'Reykjavík', country: 'Iceland', lat: 64.1466, lng: -21.9426, timezone: 'Atlantic/Reykjavik' },
  { id: 'kyoto', name: 'Kyoto', country: 'Japan', lat: 35.0116, lng: 135.7681, timezone: 'Asia/Tokyo' },
  { id: 'tromso', name: 'Tromsø', country: 'Norway', lat: 69.6492, lng: 18.9553, timezone: 'Europe/Oslo' },
  { id: 'vancouver', name: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207, timezone: 'America/Vancouver' },
  { id: 'edinburgh', name: 'Edinburgh', country: 'Scotland', lat: 55.9533, lng: -3.1883, timezone: 'Europe/London' },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780, timezone: 'Asia/Seoul' },
  { id: 'copenhagen', name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683, timezone: 'Europe/Copenhagen' },
];

export const WMO_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
};