import { useState, useEffect } from 'react';

export const useCityTime = (timezone: string) => {
  const [time, setTime] = useState<string>('--:--');

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeString = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).format(now);
        setTime(timeString);
      } catch (e) {
        console.warn('Invalid timezone', timezone);
        setTime('--:--');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, [timezone]);

  return time;
};