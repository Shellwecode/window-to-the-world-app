
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { City, WeatherData, ViewState } from './types';
import { CITIES } from './constants';
import { fetchWeather, fetchWeatherManifest } from './services/weatherService';
import CitySelect from './components/CitySelect';
import WindowFrame from './components/WindowFrame';
import AmbientBackground from './components/AmbientBackground';
import CityGridItem from './components/CityGridItem';

const App: React.FC = () => {
  const [cities, setCities] = useState<City[]>(() => {
    try {
      const fullList = localStorage.getItem('app_cities');
      if (fullList) {
          return JSON.parse(fullList);
      }
      const savedUserCities = localStorage.getItem('user_cities');
      if (savedUserCities) {
        return [...CITIES, ...JSON.parse(savedUserCities)];
      }
    } catch (e) {
      console.warn('Failed to parse saved cities', e);
    }
    return CITIES;
  });

  const [selectedCity, setSelectedCity] = useState<City | null>(cities.length > 0 ? cities[0] : null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isGridView, setIsGridView] = useState(false);
  const [manifestLoaded, setManifestLoaded] = useState(false);
  
  // Global cache to store weather data for all cities
  const [weatherCache, setWeatherCache] = useState<Record<string, WeatherData>>({});
  const cacheRef = useRef<Record<string, WeatherData>>({});

  const [viewState, setViewState] = useState<ViewState>({
    status: 'idle',
    description: null,
  });

  useEffect(() => {
    fetchWeatherManifest().then(() => setManifestLoaded(true));
  }, []);

  useEffect(() => {
    localStorage.setItem('app_cities', JSON.stringify(cities));
  }, [cities]);

  // Pre-fetch weather for all saved cities to make selection immediate
  useEffect(() => {
    const prefetch = async () => {
      const promises = cities.map(async (city) => {
        if (!cacheRef.current[city.id]) {
          try {
            const data = await fetchWeather(city);
            cacheRef.current[city.id] = data;
            setWeatherCache(prev => ({ ...prev, [city.id]: data }));
          } catch (e) {
            console.warn(`Prefetch failed for ${city.name}`);
          }
        }
      });
      await Promise.all(promises);
    };
    prefetch();
  }, [cities]);

  const loadScene = useCallback(async (city: City) => {
    try {
      // Check cache first for immediate display
      if (weatherCache[city.id]) {
        setWeather(weatherCache[city.id]);
        setViewState({
          status: 'complete',
          description: `A view of ${city.name} in ${weatherCache[city.id].conditionText.toLowerCase()} conditions.`
        });
      } else {
        setViewState(prev => ({ ...prev, status: 'loading_weather' }));
      }
      
      const weatherData = await fetchWeather(city);
      setWeather(weatherData);
      setWeatherCache(prev => ({ ...prev, [city.id]: weatherData }));
      cacheRef.current[city.id] = weatherData;
      
      setViewState({
        status: 'complete',
        description: `A view of ${city.name} in ${weatherData.conditionText.toLowerCase()} conditions.`
      });
    } catch (e) {
      console.error("Weather fetch failed", e);
      if (!weatherCache[city.id]) {
        setViewState(prev => ({ ...prev, status: 'error' }));
        setWeather(null);
      }
    }
  }, [weatherCache]);

  useEffect(() => {
    if (selectedCity && !isGridView) {
      loadScene(selectedCity);
    }
  }, [loadScene, selectedCity, isGridView]);

  const handleCityChange = (city: City) => {
    const isNewCity = !selectedCity || city.id !== selectedCity.id;
    
    if (isNewCity) {
      if (weatherCache[city.id]) {
        setWeather(weatherCache[city.id]);
      } else {
        setWeather(null);
      }
      setSelectedCity(city);
    }
    
    if (isGridView) {
      setIsGridView(false);
    }
  };

  const handleAddCity = (newCity: City) => {
    const exists = cities.find(c => c.id === newCity.id || (c.name === newCity.name && c.country === newCity.country));
    if (exists) {
        handleCityChange(exists);
        return;
    }
    const updatedCities = [...cities, newCity];
    setCities(updatedCities);
    handleCityChange(newCity); 
  };

  const handleRemoveCity = (e: React.MouseEvent, cityId: string) => {
      e.stopPropagation();
      const newCities = cities.filter(c => c.id !== cityId);
      setCities(newCities);

      if (selectedCity && selectedCity.id === cityId) {
          if (newCities.length > 0) {
              setSelectedCity(newCities[0]);
          } else {
              setSelectedCity(null);
              setWeather(null);
          }
      }
  };

  const handleReorderCities = (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const newCities = [...cities];
      const [movedCity] = newCities.splice(fromIndex, 1);
      newCities.splice(toIndex, 0, movedCity);
      setCities(newCities);
  };

  return (
    <div className="relative h-[100dvh] w-full flex flex-col items-center justify-start overflow-hidden selection:bg-white/10 selection:text-white transition-colors duration-1000">
      <AmbientBackground weather={weather} />
      
      <main className="relative z-10 flex flex-col w-full max-w-6xl h-full overflow-hidden">
        {/* Fixed Header Region - Consistent padding and height constraint */}
        <header className="w-full flex flex-col md:flex-row items-center justify-between px-6 pt-8 pb-4 md:pt-12 md:pb-8 gap-6 shrink-0 z-50">
          <div className="text-center md:text-left">
            <h1 className="text-2xl font-light tracking-widest text-white/90 uppercase">
              Window to the World
            </h1>
            <p className="text-xs text-white/40 tracking-wider mt-1 font-mono">
              ECHOES OF LIGHT & TIME
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
                onClick={() => setIsGridView(!isGridView)}
                className="p-3 rounded-full glass-panel text-white/50 hover:text-white transition-all active:scale-95"
                title={isGridView ? "Switch to Window View" : "Switch to Grid View"}
                disabled={!selectedCity && !isGridView}
            >
                {isGridView ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" /></svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                )}
            </button>
            <CitySelect 
                cities={cities} 
                selectedCity={selectedCity} 
                onSelect={handleCityChange} 
                onAddCity={handleAddCity}
                disabled={!isGridView && viewState.status === 'loading_weather' && !weather}
            />
          </div>
        </header>

        {/* Scrollable Content Region - Prevents overlap by taking remaining flex space */}
        <section className="w-full grow overflow-y-auto px-6 pb-8 md:pb-12 scrollbar-hide overflow-x-hidden">
            {isGridView ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full py-2">
                    {cities.map((city, index) => (
                        <CityGridItem 
                            key={city.id} 
                            city={city} 
                            index={index}
                            onSelect={handleCityChange}
                            isSelected={selectedCity?.id === city.id}
                            onRemove={handleRemoveCity}
                            onReorder={handleReorderCities}
                        />
                    ))}
                    {cities.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-white/30 border-2 border-dashed border-white/5 rounded-2xl">
                            <p className="mb-2">No cities added</p>
                            <p className="text-sm font-light">Search and add a location using the selector above</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-full flex flex-col gap-6 h-full min-h-0 py-2">
                    <div className="w-full aspect-[4/3] md:aspect-[16/9] grow max-h-[70vh] min-h-[300px]">
                        {selectedCity ? (
                            <WindowFrame 
                                viewState={viewState} 
                                weather={weather} 
                                city={selectedCity}
                                manifestReady={manifestLoaded}
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 rounded-[12px] border border-white/10 text-white/30">
                                <p className="font-light">No city selected</p>
                                <button 
                                    onClick={() => setIsGridView(true)} 
                                    className="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs uppercase tracking-widest transition-all text-white/60"
                                >
                                    Open Grid
                                </button>
                            </div>
                        )}
                    </div>

                    {selectedCity && (
                        <footer className="w-full text-center fade-in delay-300 shrink-0 min-h-[3rem] pb-4">
                        {viewState.status === 'loading_weather' && !weather && (
                            <p className="text-sm text-white/50 animate-pulse font-mono tracking-widest">
                            SYNCING ATMOSPHERE...
                            </p>
                        )}
                        {viewState.status === 'complete' && viewState.description && (
                            <p className="text-sm text-white/60 font-light max-w-2xl mx-auto leading-relaxed opacity-80 italic">
                            {viewState.description}
                            </p>
                        )}
                        {viewState.status === 'error' && (
                            <p className="text-sm text-red-400/80 font-mono">
                            Connection interrupted. Please try another city.
                            </p>
                        )}
                        </footer>
                    )}
                </div>
            )}
        </section>
      </main>
    </div>
  );
};

export default App;
