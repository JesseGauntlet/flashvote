'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type Location = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  zip_code?: string | null;
  lat?: number | null;
  lon?: number | null;
};

type LocationContextType = {
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location | null) => void;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Local storage key for persisting location
const LOCATION_STORAGE_KEY = 'flashvote-selected-location';

interface LocationProviderProps {
  children: React.ReactNode;
  initialLocationId?: string | null;
}

export function LocationProvider({ 
  children,
  initialLocationId 
}: LocationProviderProps) {
  const [selectedLocation, setSelectedLocationState] = useState<Location | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Load location from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasInitialized) {
      try {
        const storedLocation = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (storedLocation) {
          const locationData = JSON.parse(storedLocation);
          setSelectedLocationState(locationData);
          setHasInitialized(true);
          return;
        }
      } catch (error) {
        console.error('Error reading from localStorage:', error);
      }
    }
  }, [hasInitialized]);
  
  // When location changes, update the URL query parameter and localStorage
  const setSelectedLocation = (location: Location | null) => {
    setSelectedLocationState(location);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        if (location) {
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
        } else {
          localStorage.removeItem(LOCATION_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
    
    // Update URL with location parameter
    const params = new URLSearchParams(searchParams.toString());
    
    if (location) {
      params.set('location', location.id);
    } else {
      params.delete('location');
    }
    
    // Replace current URL with the updated query parameters
    router.replace(`${pathname}?${params.toString()}`);
  };
  
  // Initialize the selected location from initialLocationId
  useEffect(() => {
    if (initialLocationId && !hasInitialized) {
      // Fetch the location data from API if we only have ID
      const fetchLocation = async () => {
        try {
          const response = await fetch(`/api/locations/${initialLocationId}`);
          if (response.ok) {
            const locationData = await response.json();
            setSelectedLocationState(locationData);
            
            // Also save to localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
            }
          }
        } catch (error) {
          console.error('Error fetching location data:', error);
        } finally {
          setHasInitialized(true);
        }
      };
      
      fetchLocation();
    } else if (!initialLocationId && !selectedLocation && !hasInitialized) {
      setHasInitialized(true);
    }
  }, [initialLocationId, hasInitialized, selectedLocation]);
  
  const value = {
    selectedLocation,
    setSelectedLocation
  };
  
  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
} 