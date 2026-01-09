export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
}

export interface WeatherData {
  temperature: number; // Celsius
  conditionCode: number; // OpenMeteo WMO code
  conditionText: string;
  isDay: boolean;
  localTime: string; // Formatted HH:MM string
}

export type ViewStatus = 'idle' | 'loading_weather' | 'complete' | 'error';

export interface ViewState {
  status: ViewStatus;
  description: string | null;
}
