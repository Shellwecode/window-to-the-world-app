import React, { useMemo } from 'react';
import { WeatherData } from '../types';
import { getWeatherGradient } from '../services/weatherService';

interface AmbientBackgroundProps {
  weather: WeatherData | null;
}

const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ weather }) => {
  const bgStyle = useMemo(() => getWeatherGradient(weather), [weather]);

  return (
    <>
        <div className={`absolute inset-0 transition-colors duration-[3000ms] ease-in-out ${bgStyle} opacity-20`}></div>
        {/* Vignette */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#0f1012] opacity-90 pointer-events-none"></div>
    </>
  );
};

export default AmbientBackground;