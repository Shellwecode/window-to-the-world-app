import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { City } from '../types';
import { searchCities } from '../services/weatherService';

interface CitySelectProps {
  cities: City[];
  selectedCity: City | null;
  onSelect: (city: City) => void;
  onAddCity: (city: City) => void;
  disabled: boolean;
}

const CitySelect: React.FC<CitySelectProps> = ({ cities, selectedCity, onSelect, onAddCity, disabled }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0, width: 0 });
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (isDropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 12, // Increased spacing for better separation
        right: window.innerWidth - rect.right,
        width: Math.max(rect.width, 280)
      });
    }
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleReposition = () => {
      if (isDropdownOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom + 12,
          right: window.innerWidth - rect.right,
          width: Math.max(rect.width, 280)
        });
      }
    };
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const citiesResult = await searchCities(query);
      setResults(citiesResult);
      setIsSearching(false);
      setSelectedIndex(-1);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (isSearchOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  const handleSelectSaved = (city: City) => {
    onSelect(city);
    setIsDropdownOpen(false);
  };

  const handleSelectNew = (city: City) => {
    const alreadySaved = cities.find(c => c.id === city.id);
    if (alreadySaved) {
      onSelect(alreadySaved);
    } else {
      onAddCity(city);
    }
    closeSearch();
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setQuery('');
    setResults([]);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (results.length > 0 && selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectNew(results[selectedIndex]);
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* 1. LOCATION DROPDOWN TRIGGER */}
      <div className="relative">
        <button
          ref={triggerRef}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          className={`flex items-center gap-4 px-5 py-3 rounded-full glass-panel glass-medium transition-all duration-500 hover:brightness-110 active:scale-95 disabled:opacity-50 ${isDropdownOpen ? 'ring-2 ring-white/20' : ''}`}
        >
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono leading-none mb-1.5">Location</span>
            <span className="text-sm font-light text-white tracking-wide">
              {selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : 'Select a city'}
            </span>
          </div>
          <svg className={`w-3.5 h-3.5 text-white/40 transition-transform duration-500 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* DROPDOWN MENU - Portal, z-800 */}
        {isDropdownOpen && createPortal(
          <>
            <div 
              className="fixed inset-0 z-[799] cursor-default" 
              onClick={() => setIsDropdownOpen(false)} 
            />
            <div 
              style={{ 
                top: `${dropdownPos.top}px`, 
                right: `${dropdownPos.right}px`,
                width: `${dropdownPos.width}px`
              }}
              className="fixed glass-panel glass-medium rounded-[24px] z-[800] overflow-hidden animate-in fade-in slide-in-from-top-3 duration-500"
            >
              <div className="relative p-2 max-h-[60vh] overflow-y-auto scrollbar-hide">
                {cities.length > 0 ? (
                  cities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelectSaved(city)}
                      className={`flex items-center justify-between w-full px-5 py-4 rounded-[18px] text-left transition-all duration-300 group mb-1 last:mb-0
                        ${selectedCity?.id === city.id ? 'bg-white/10' : 'hover:bg-white/5'}
                      `}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className={`text-sm tracking-wide transition-colors duration-300 font-light ${selectedCity?.id === city.id ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
                          {city.name}
                        </div>
                        <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-mono group-hover:text-white/50 transition-colors">
                          {city.country}
                        </div>
                      </div>
                      {selectedCity?.id === city.id && (
                        <div className="w-2 h-2 rounded-full bg-white/60 shadow-[0_0_12px_rgba(255,255,255,0.4)]"></div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="py-12 px-6 text-center">
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-mono">No locations saved</p>
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>

      {/* 2. SEARCH / ADD BUTTON */}
      <button
        onClick={() => setIsSearchOpen(true)}
        disabled={disabled}
        className="p-3.5 rounded-full glass-panel glass-medium text-white/40 hover:text-white/90 hover:brightness-110 transition-all active:scale-95"
        title="Add new city"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* 3. SEARCH MODAL - Portal, z-1000 */}
      {isSearchOpen && createPortal(
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-[8px] z-[900] animate-in fade-in duration-700"
            onClick={closeSearch}
          />
          
          <div 
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg mx-auto glass-panel glass-strong rounded-[32px] z-[1000] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-8 duration-700"
            onKeyDown={handleSearchKeyDown}
          >
            <div className="relative p-8 border-b border-white/5">
              <div className="relative flex items-center h-16">
                <div className="absolute left-5 flex items-center justify-center pointer-events-none">
                  <svg className="w-5 h-5 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Where would you like to visit?"
                  className="w-full h-full bg-black/20 text-white border-none rounded-[20px] pl-14 pr-12 text-base font-light outline-none ring-1 ring-white/10 focus:ring-white/30 transition-all placeholder:text-white/20"
                />

                {isSearching && (
                  <div className="absolute right-5 flex items-center">
                    <div className="w-4 h-4 border-2 border-white/10 border-t-white/40 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative overflow-y-auto grow p-4 min-h-[160px] max-h-[50vh] scrollbar-hide">
              {query.length < 2 ? (
                <div className="py-20 px-6 text-center flex flex-col items-center">
                  <div className="text-white/10 mb-6 scale-125">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                  <p className="text-xs text-white/30 font-light tracking-[0.3em] uppercase italic">Exploring the horizon...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1.5 py-2">
                  <p className="px-6 py-4 text-[10px] text-white/30 tracking-[0.3em] uppercase font-mono">Suggested Places</p>
                  {results.map((city, idx) => (
                    <button
                      key={`${city.id}-${idx}`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleSelectNew(city)}
                      className={`flex flex-col w-full px-6 py-5 rounded-[24px] transition-all duration-500 text-left
                        ${selectedIndex === idx ? 'bg-white/10 translate-x-2' : 'hover:bg-white/5'}
                      `}
                    >
                      <div className="text-sm text-white/95 font-light tracking-wide">{city.name}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-[0.25em] font-mono mt-1">{city.country}</div>
                    </button>
                  ))}
                </div>
              ) : !isSearching && (
                <div className="py-24 px-6 text-center">
                  <p className="text-sm text-white/30 font-light italic">The city of "{query}" remains elusive.</p>
                </div>
              )}
            </div>

            <div className="relative p-6 bg-black/10 border-t border-white/5 flex justify-between items-center px-10">
              <div className="flex gap-6 text-[10px] text-white/25 uppercase tracking-[0.25em] font-mono">
                <span className="flex items-center gap-2"><kbd className="bg-white/5 px-2 py-1 rounded border border-white/10">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-2"><kbd className="bg-white/5 px-2 py-1 rounded border border-white/10">⏎</kbd> arrive</span>
              </div>
              <button 
                onClick={closeSearch}
                className="text-[10px] text-white/40 hover:text-white/90 transition-colors uppercase tracking-[0.25em] font-mono"
              >
                Close [Esc]
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default CitySelect;