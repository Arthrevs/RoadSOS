import { useState, useEffect } from 'react';

export function useNetwork() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Online/offline detection logic goes here
  }, []);

  return isOnline;
}
