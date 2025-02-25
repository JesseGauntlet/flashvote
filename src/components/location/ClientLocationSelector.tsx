'use client';

import { useState } from 'react';
import { LocationSelector } from './LocationSelector';

interface ClientLocationSelectorProps {
  eventId: string;
  initialLocationId: string | null;
}

export function ClientLocationSelector({ eventId, initialLocationId }: ClientLocationSelectorProps) {
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(initialLocationId);
  
  const handleLocationChange = (locationId: string | null) => {
    setSelectedLocationId(locationId);
    
    // Update URL with the selected location
    const url = new URL(window.location.href);
    if (locationId) {
      url.searchParams.set('location', locationId);
    } else {
      url.searchParams.delete('location');
    }
    window.history.pushState({}, '', url.toString());
  };
  
  return (
    <LocationSelector
      eventId={eventId}
      selectedLocationId={selectedLocationId}
      onLocationChange={handleLocationChange}
    />
  );
} 