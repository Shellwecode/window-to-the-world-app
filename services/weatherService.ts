
import { City, WeatherData } from '../types';
import { WMO_CODES } from '../constants';

const RAW_GITHUB_BASE = "https://raw.githubusercontent.com/Shellwecode/weather-illustrations/main";

/**
 * Manifest structure expected from a specific folder's index.json:
 * ["image1.png", "image2.png", ...]
 */
type FolderManifest = string[];

// Cache for folder manifests to avoid redundant fetches
const manifestCache: Record<string, FolderManifest> = {};
const pendingManifests: Record<string, Promise<FolderManifest>> = {};

/**
 * Fetches the manifest file for a specific weather category folder.
 */
export const fetchFolderManifest = async (category: string): Promise<FolderManifest> => {
  if (manifestCache[category]) return manifestCache[category];
  if (pendingManifests[category]) return pendingManifests[category];

  pendingManifests[category] = fetch(`${RAW_GITHUB_BASE}/${category}/index.json`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Manifest for ${category} not found`);
      const data = await res.json();
      manifestCache[category] = data;
      return data;
    })
    .catch((err) => {
      console.warn(`Failed to fetch manifest for ${category}`, err);
      manifestCache[category] = [];
      return [];
    })
    .finally(() => {
      delete pendingManifests[category];
    });

  return pendingManifests[category];
};

/**
 * Resolves the correct category string for a weather state.
 */
export const getWeatherCategory = (weather: WeatherData | null): string | null => {
  if (!weather) return null;
  const code = weather.conditionCode;
  let condition = 'clear';

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    condition = 'snow';
  } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    condition = 'rain';
  } else {
    condition = 'clear';
  }

  return `${condition}-${weather.isDay ? 'day' : 'night'}`;
};

/**
 * Selects a stable image URL from a manifest using a seed.
 */
export const selectImageFromManifest = (category: string, manifest: FolderManifest, seed: string): string | null => {
  if (!manifest || manifest.length === 0) return null;

  // Simple hash for stable selection
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  
  const index = Math.abs(hash) % manifest.length;
  const filename = manifest[index];
  
  return `${RAW_GITHUB_BASE}/${category}/${filename}`;
};

/**
 * Returns the text contrast class based on the hour.
 * Primarily used by the EXPANDED window view.
 */
export const getTextContrastClass = (timeStr: string | null): { main: string; sub: string } => {
  if (!timeStr) return { main: 'text-zinc-950', sub: 'text-zinc-500' };

  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let hour = 12;
  if (match) {
    hour = parseInt(match[1], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  }

  // Use dark text for Morning and Afternoon (6 AM to 6 PM) in EXPANDED view
  if (hour >= 6 && hour < 18) {
    return { main: 'text-zinc-900', sub: 'text-zinc-500' };
  }
  // All other times (Evening, Night, Deep Night, Early Morning) use white text
  return { main: 'text-white', sub: 'text-white/70' };
};

/**
 * Maps hour to specific time-of-day buckets and colors.
 */
export const getTimeOfDayBg = (timeStr: string | null, cityName?: string): string => {
  if (!timeStr) return '#F7F9FF';

  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let hour = 12;
  if (match) {
    hour = parseInt(match[1], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
  }

  let bucket = "";
  let color = "";

  if (hour >= 23 || hour < 3) {
    bucket = "Deep Night";
    color = "#273657";
  } else if (hour >= 3 && hour < 6) {
    bucket = "Late Night";
    color = "#4E72A0";
  } else if (hour >= 6 && hour < 12) {
    bucket = "Morning";
    color = "#F7F9FF";
  } else if (hour >= 12 && hour < 18) {
    bucket = "Afternoon";
    color = "#F2F4FF";
  } else {
    bucket = "Evening";
    color = "#96A8C2";
  }

  return color;
};

/**
 * Helper for weather gradients based on condition and time.
 */
export const getWeatherGradient = (weather: WeatherData | null): string => {
  if (!weather) return 'bg-[#0f1012]'; 

  if (weather.isDay) {
      if ([0, 1].includes(weather.conditionCode)) return 'bg-gradient-to-br from-[#4a6fa5] to-[#c0d6df]'; 
      if ([2, 3, 45, 48].includes(weather.conditionCode)) return 'bg-gradient-to-br from-[#748cab] to-[#d4dbe3]';
      if ([51, 61, 80, 81, 82, 63, 65].includes(weather.conditionCode)) return 'bg-gradient-to-br from-[#4d5b6b] to-[#8fa2b8]';
      if ([71, 73, 75, 77, 85, 86].includes(weather.conditionCode)) return 'bg-gradient-to-br from-[#dfe4ea] to-[#f1f2f6]'; 
      return 'bg-gradient-to-br from-[#8d99ae] to-[#edf2f4]'; 
  } else {
      if ([0, 1].includes(weather.conditionCode)) return 'bg-gradient-to-br from-[#0b0f19] to-[#1b263b]';
      if ([71, 73, 75, 77, 85, 86].includes(weather.conditionCode)) return 'bg-gradient-to-br from-[#1a1b26] to-[#2e3440]';
      return 'bg-gradient-to-br from-[#08090a] to-[#161a1d]';
  }
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchWeather = async (city: City, retries = 3): Promise<WeatherData> => {
  const timezoneParam = city.timezone || 'auto';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,weather_code,is_day&timezone=${encodeURIComponent(timezoneParam)}`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 429) {
           await wait(1500 * (i + 1));
           continue; 
        }
        throw new Error(`Weather API Error: ${response.status}`);
      }
      
      const data = await response.json();
      const current = data.current;
      const now = new Date();
      const localTime = new Intl.DateTimeFormat('en-US', {
        timeZone: city.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(now);

      return {
        temperature: current.temperature_2m,
        conditionCode: current.weather_code,
        conditionText: WMO_CODES[current.weather_code] || 'Unknown',
        isDay: current.is_day === 1,
        localTime,
      };
    } catch (e: any) {
      if (i === retries - 1) throw e;
      await wait(500 * Math.pow(2, i));
    }
  }
  throw new Error('Weather fetch failed');
};

export const searchCities = async (query: string): Promise<City[]> => {
  if (!query || query.length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.results) return [];
    return data.results.map((result: any) => ({
      id: String(result.id),
      name: result.name,
      country: result.country,
      lat: result.latitude,
      lng: result.longitude,
      timezone: result.timezone || 'UTC',
    }));
  } catch (error) {
    return [];
  }
};

export const fetchWeatherManifest = async () => ({});
export const getWeatherImage = () => null;
