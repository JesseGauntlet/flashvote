'use client';

import { LocationProvider } from './LocationContext';
import { LocationSelector } from './LocationSelector';

interface ClientLocationSelectorProps {
  eventId: string;
  initialLocationId?: string | null;
}

export function ClientLocationSelector({ 
  eventId, 
  initialLocationId 
}: ClientLocationSelectorProps) {
  return (
    <LocationProvider initialLocationId={initialLocationId}>
      <LocationSelector eventId={eventId} />
    </LocationProvider>
  );
} 