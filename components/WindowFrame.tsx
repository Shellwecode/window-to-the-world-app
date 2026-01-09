
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ViewState, WeatherData, City } from '../types';
import { useCityTime } from '../hooks/useCityTime';
import { 
  getWeatherGradient, 
  getWeatherCategory, 
  getTimeOfDayBg, 
  getTextContrastClass,
  fetchFolderManifest, 
  selectImageFromManifest 
} from '../services/weatherService';

interface WindowFrameProps {
  viewState: ViewState;
  weather: WeatherData | null;
  city: City;
  manifestReady: boolean;
}

/**
 * AtmosphericOverlays renders environmental motion effects based on weather.
 * Only applied to the expanded view for subtle immersion.
 */
const AtmosphericOverlays: React.FC<{ weather: WeatherData | null }> = ({ weather }) => {
  if (!weather) return null;

  const category = getWeatherCategory(weather) || '';
  const isRain = category.startsWith('rain');
  const isSnow = category.startsWith('snow');
  const isClear = category.startsWith('clear');
  const isNight = !weather.isDay;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* 1. Rain Effect - Mirrored direction (Top-Left to Bottom-Right) */}
      {isRain && (
        <>
          <div className="absolute inset-0 opacity-[0.08] animate-[rain_1s_linear_infinite] bg-[length:100px_100px] bg-[linear-gradient(105deg,transparent_45%,rgba(255,255,255,0.4)_50%,transparent_55%)]"></div>
          <div className="absolute inset-0 opacity-[0.05] animate-[rain_1.4s_linear_infinite] bg-[length:140px_140px] bg-[linear-gradient(105deg,transparent_45%,rgba(255,255,255,0.3)_50%,transparent_55%)] delay-300"></div>
        </>
      )}

      {/* 2. Snow Effect (Enhanced Visibility & Depth) */}
      {isSnow && (
        <>
          {/* Foreground - Largest, fastest, highest opacity */}
          <div className="absolute inset-0 opacity-[0.70] animate-[snow-fast_6s_linear_infinite] bg-[length:250px_250px] bg-[radial-gradient(circle,white_1.2px,transparent_1.2px)]"></div>
          
          {/* Midground - Medium size, medium speed */}
          <div className="absolute inset-0 opacity-[0.60] animate-[snow-med_10s_linear_infinite] bg-[length:350px_350px] bg-[radial-gradient(circle,white_1.0px,transparent_1.0px)] delay-500"></div>
          
          {/* Background - Smallest, slowest, lowest opacity */}
          <div className="absolute inset-0 opacity-[0.50] animate-[snow-slow_15s_linear_infinite] bg-[length:450px_450px] bg-[radial-gradient(circle,white_0.8px,transparent_0.8px)] delay-1000"></div>
        </>
      )}

      {/* 3. Night Lamp Glows - Multi-point to adapt to varying compositions */}
      {isNight && (
        <>
          {/* Primary Warm Pulse Glow (Left-Center) */}
          <div className="absolute left-[20%] top-[35%] w-[45%] h-[45%] rounded-full bg-amber-400/15 blur-[100px] animate-[glow_12s_ease-in-out_infinite] mix-blend-screen"></div>
          
          {/* Secondary Distant Glow (Right-High) */}
          <div className="absolute right-[15%] top-[25%] w-[35%] h-[35%] rounded-full bg-amber-300/10 blur-[90px] animate-[glow_14s_ease-in-out_infinite_reverse] mix-blend-screen"></div>
        </>
      )}

      {/* 4. Clear Day Shimmer - Enhanced for visibility */}
      {isClear && !isNight && (
        <div className="absolute inset-0 opacity-[0.14] animate-[shimmer_20s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full rotate-45 pointer-events-none"></div>
      )}
    </div>
  );
};

const WindowFrame: React.FC<WindowFrameProps> = ({ viewState, weather, city }) => {
  const isLoading = viewState.status === 'loading_weather';
  const liveTime = useCityTime(city.timezone);
  const [imgState, setImgState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const prevSrc = useRef<string | null>(null);
  const categoryRef = useRef<string | null>(null);
  
  const gradientClass = getWeatherGradient(weather);
  
  const timeBgColor = useMemo(() => {
    return getTimeOfDayBg(weather?.localTime || null, city.name);
  }, [weather?.localTime, city.name]);

  useEffect(() => {
    let isMounted = true;
    const category = getWeatherCategory(weather);
    
    if (!category) {
      if (!isLoading) {
        setCurrentSrc(null);
        setImgState('error');
      }
      return;
    }

    const loadManifest = async () => {
      // Resolve manifest immediately if cached
      const manifest = await fetchFolderManifest(category);
      if (!isMounted) return;
      
      const url = selectImageFromManifest(category, manifest, city.id);
      if (url) {
        if (url !== currentSrc) {
          // Only trigger loading state if the category or city actually changed
          if (category !== categoryRef.current || city.id !== city.id) {
             setImgState('loading');
          }
          setCurrentSrc(url);
          prevSrc.current = url;
          categoryRef.current = category;
        } else if (imgState === 'error') {
          setImgState('loading');
        }
      } else {
        setCurrentSrc(null);
        setImgState('error');
      }
    };

    loadManifest();
    return () => { isMounted = false; };
  }, [weather, city.id, isLoading]);
  
  const contrast = useMemo(() => getTextContrastClass(weather?.localTime || null), [weather?.localTime]);

  return (
    <div className="relative w-full h-full rounded-[12px] overflow-hidden shadow-2xl transition-all duration-1000 bg-[#0a0a0a] ring-1 ring-white/10 group">
      <div 
        className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden transition-colors duration-1000"
        style={{ backgroundColor: timeBgColor }}
      >
        {/* Atmosphere fallback gradient - subtle tinting */}
        <div 
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-out ${gradientClass} opacity-[0.12]`}
        ></div>

        {/* Dynamic Weather Illustration */}
        {currentSrc && (
          <img 
            key={currentSrc}
            src={currentSrc}
            alt={weather?.conditionText || "Weather illustration"}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out z-10
              ${imgState === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
              will-change-transform animate-[kenburns_20s_infinite_alternate]
            `}
            onLoad={() => setImgState('loaded')}
            onError={() => setImgState('error')}
          />
        )}

        {/* Ambient Motion Overlays (Expanded view only) */}
        <AtmosphericOverlays weather={weather} />

        {/* Legibility Layer - subtle gradient for dark text contrast protection */}
        <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 via-transparent to-transparent z-30 pointer-events-none transition-opacity duration-1000 ${contrast.main === 'text-white' ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* Loading skeleton pulse - only visible if we truly have no image source or weather data */}
        <div 
          className={`absolute inset-0 z-40 transition-opacity duration-1000 bg-black/10 ${isLoading && !weather ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
             <div className="w-full h-full animate-pulse bg-white/5"></div>
        </div>
      </div>

      {/* Decorative grain/noise texture */}
      <div className="absolute inset-0 z-40 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat"></div>
      
      {/* Weather Data Display */}
      <div className="absolute bottom-8 left-8 z-50 flex flex-col gap-0 select-none pointer-events-none">
         <div className={`flex items-baseline gap-2.5 transition-colors duration-1000 ${contrast.main}`}>
           <span className="text-5xl font-extralight tracking-tighter leading-none">
             {weather ? `${Math.round(weather.temperature)}°` : '--'}
           </span>
           <span className="text-sm font-medium tracking-[0.2em] uppercase">
             {city.name}
           </span>
         </div>
         <div className={`text-[11px] tracking-widest font-mono uppercase pl-1 mt-1 transition-colors duration-1000 ${contrast.sub}`}>
           {liveTime} <span className="mx-1 opacity-50">•</span> {weather ? weather.conditionText : 'Syncing atmosphere...'}
         </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes kenburns {
            0% { transform: scale(1.0); }
            100% { transform: scale(1.08); }
          }
          @keyframes rain {
            0% { background-position: 0 0; }
            100% { background-position: 40px 400px; }
          }
          @keyframes snow-fast {
            0% { background-position: 0 0; }
            100% { background-position: 30px 250px; }
          }
          @keyframes snow-med {
            0% { background-position: 0 0; }
            100% { background-position: -20px 350px; }
          }
          @keyframes snow-slow {
            0% { background-position: 0 0; }
            100% { background-position: 10px 450px; }
          }
          @keyframes glow {
            0%, 100% { opacity: 0.6; transform: scale(1); filter: blur(100px); }
            50% { opacity: 0.8; transform: scale(1.08); filter: blur(110px); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-150%) rotate(45deg); opacity: 0; }
            10% { opacity: 0.14; }
            90% { opacity: 0.14; }
            100% { transform: translateX(250%) rotate(45deg); opacity: 0; }
          }
        }
      `}</style>
    </div>
  );
};

export default WindowFrame;
