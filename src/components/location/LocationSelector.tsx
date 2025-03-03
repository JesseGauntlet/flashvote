'use client';

import { useState, useEffect } from 'react';
import { useLocation, Location } from './LocationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchIcon, XCircleIcon, MapPinIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { Skeleton } from '@/components/ui/skeleton';

interface LocationSelectorProps {
  eventId: string;
}

export function LocationSelector({ eventId }: LocationSelectorProps) {
  const { selectedLocation, setSelectedLocation } = useLocation();
  const [zipCode, setZipCode] = useState('');
  const [searchResults, setSearchResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedZipCode = useDebounce(zipCode, 500);
  
  useEffect(() => {
    if (!debouncedZipCode || debouncedZipCode.length < 3) {
      setSearchResults([]);
      return;
    }
    
    const searchLocations = async () => {
      setIsSearching(true);
      setError(null);
      
      try {
        const response = await fetch(
          `/api/locations/search?zip_code=${debouncedZipCode}&event_id=${eventId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to search locations');
        }
        
        const data = await response.json();
        setSearchResults(data.locations || []);
      } catch (err) {
        console.error('Error searching locations:', err);
        setError('Failed to search locations');
      } finally {
        setIsSearching(false);
      }
    };
    
    searchLocations();
  }, [debouncedZipCode, eventId]);
  
  const handleClearLocation = () => {
    setSelectedLocation(null);
    setSearchResults([]);
    setZipCode('');
  };
  
  return (
    <Card className="shadow-md mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Location</h3>
          {selectedLocation && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-sm"
              onClick={handleClearLocation}
            >
              <XCircleIcon className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
        
        {selectedLocation ? (
          <div className="bg-muted p-3 rounded-md flex items-center">
            <MapPinIcon className="h-5 w-5 text-primary mr-2" />
            <div>
              <div className="font-medium">{selectedLocation.name}</div>
              <div className="text-sm text-muted-foreground">
                {[
                  selectedLocation.address,
                  selectedLocation.city,
                  selectedLocation.zip_code
                ].filter(Boolean).join(', ')}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label htmlFor="zipCode">Search by ZIP code</Label>
              <div className="relative mt-1">
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="Enter ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="pr-10"
                />
                <SearchIcon className="h-4 w-4 absolute top-3 right-3 text-muted-foreground" />
              </div>
            </div>
            
            {isSearching && (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            )}
            
            {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((location) => (
                  <Button
                    key={location.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-3 text-left"
                    onClick={() => setSelectedLocation(location)}
                  >
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {[
                          location.address,
                          location.city,
                          location.zip_code
                        ].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
            
            {!isSearching && debouncedZipCode && debouncedZipCode.length >= 3 && searchResults.length === 0 && (
              <div className="text-center p-3 text-muted-foreground">
                No locations found for this ZIP code.
              </div>
            )}
            
            {error && (
              <div className="text-center p-3 text-destructive">
                {error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 