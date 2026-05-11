import { useState, useEffect } from 'react';

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // GPS + IP geolocation fallback logic goes here
  }, []);

  return { location, error };
}
