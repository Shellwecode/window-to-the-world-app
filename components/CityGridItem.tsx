
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { City, WeatherData } from '../types';
import { 
  fetchWeather, 
  getWeatherGradient, 
  getWeatherCategory, 
  getTimeOfDayBg, 
  fetchFolderManifest, 
  selectImageFromManifest 
} from '../services/weatherService';
import { useCityTime } from '../hooks/useCityTime';

interface CityGridItemProps {
  city: City;
  index: number;
  onSelect: (city: City) => void;
  isSelected: boolean;
  onRemove: (e: React.MouseEvent, cityId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

const CityGridItem: React.FC<CityGridItemProps> = ({ city, index, onSelect, isSelected, onRemove, onReorder }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const liveTime = useCityTime(city.timezone);
  const [isLoading, setIsLoading] = useState(true);
  
  const [imgState, setImgState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const prevSrc = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
      if (!isMounted) return;
      try {
        const data = await fetchWeather(city);
        if (isMounted) {
            setWeather(data);
            setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) setIsLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [city]); 

  const gradientClass = getWeatherGradient(weather);
  
  useEffect(() => {
    let isMounted = true;
    const category = getWeatherCategory(weather);
    
    if (!category) return;

    const loadManifest = async () => {
      const manifest = await fetchFolderManifest(category);
      if (!isMounted) return;
      
      const url = selectImageFromManifest(category, manifest, city.id);
      if (url && url !== prevSrc.current) {
        setImgState('loading');
        setCurrentSrc(url);
        prevSrc.current = url;
      } else if (!url) {
        setImgState('error');
      }
    };

    loadManifest();
    return () => { isMounted = false; };
  }, [weather, city.id]);
  
  // Base background color strictly based on local time buckets
  const timeBgColor = useMemo(() => {
    return getTimeOfDayBg(weather?.localTime || null, city.name);
  }, [weather?.localTime, city.name]);

  // Enforce consistent white text for Grid Items
  const contrast = {
    main: 'text-white/90',
    sub: 'text-white/70'
  };

  const handleDragStart = (e: React.DragEvent) => {
      e.dataTransfer.setData('cityIndex', index.toString());
      e.dataTransfer.effectAllowed = 'move';
      setIsDragging(true);
  };

  const handleDragEnd = () => setIsDragging(false);
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const fromIndexStr = e.dataTransfer.getData('cityIndex');
      if (fromIndexStr) {
          const fromIndex = parseInt(fromIndexStr, 10);
          onReorder(fromIndex, index);
      }
      setIsDragging(false);
  };

  return (
    <div 
      role="button"
      tabIndex={0}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => onSelect(city)}
      onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect(city);
      }}
      className={`relative group aspect-video rounded-[12px] overflow-hidden text-left transition-all duration-500 w-full cursor-pointer
        ${isSelected ? 'ring-2 ring-white/50 scale-[1.02]' : 'ring-1 ring-white/10 hover:ring-white/30 hover:scale-[1.01]'}
        ${isDragging ? 'opacity-50 grayscale' : 'opacity-100'}
      `}
    >
      <div 
        className="absolute inset-0 transition-colors duration-1000"
        style={{ backgroundColor: timeBgColor }}
      >
        {/* Low opacity weather gradient overlay */}
        <div 
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${gradientClass} opacity-[0.12]`}
        ></div>

        {currentSrc && (
          <img 
            key={currentSrc}
            src={currentSrc}
            alt=""
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out will-change-transform pointer-events-none
              ${imgState === 'loaded' ? 'opacity-100 scale-100 group-hover:scale-110' : 'opacity-0 scale-105'}
            `}
            onLoad={() => setImgState('loaded')}
            onError={() => setImgState('error')}
          />
        )}

        {/* Protection overlay - STRONGER permanent gradient to ensure white text legibility on light backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent z-0 transition-opacity duration-500 opacity-100"></div>

        {isLoading && !weather && <div className="absolute inset-0 bg-white/5 animate-pulse z-20"></div>}
      </div>

      <button
        onClick={(e) => onRemove(e, city.id)}
        className="absolute top-2 right-2 z-30 p-1.5 rounded-full bg-black/40 hover:bg-red-500 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-md border border-white/10"
        title="Remove city"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <div className={`relative z-20 p-4 h-full flex flex-col justify-between transition-colors duration-1000 pointer-events-none`}>
        <div className="flex justify-between items-start">
            <span className={`text-xs font-semibold tracking-widest uppercase truncate pr-6 ${contrast.main}`}>
            {city.name}
            </span>
             {weather && (
                <span className={`text-xl font-light ${contrast.main}`}>
                    {Math.round(weather.temperature)}°
                </span>
            )}
        </div>
        
        <div className="space-y-0.5">
            <div className={`text-xs font-mono ${contrast.main}`}>
                {liveTime}
            </div>
            {weather ? (
                <div className={`text-[10px] uppercase tracking-widest truncate ${contrast.sub}`}>
                    {weather.conditionText}
                </div>
            ) : (
                <div className={`h-3 w-12 bg-white/10 rounded ${isLoading ? 'animate-pulse' : ''}`}></div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CityGridItem;
