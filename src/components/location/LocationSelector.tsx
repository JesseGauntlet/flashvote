'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Location {
  id: string;
  name: string;
  city: string | null;
}

interface LocationSelectorProps {
  eventId: string;
  selectedLocationId: string | null;
  onLocationChange: (locationId: string | null) => void;
}

export function LocationSelector({
  eventId,
  selectedLocationId,
  onLocationChange,
}: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from('locations')
          .select('id, name, city')
          .eq('event_id', eventId)
          .order('name');

        if (error) {
          throw new Error(error.message);
        }

        setLocations(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch locations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [eventId]);

  const selectedLocation = selectedLocationId
    ? locations.find((location) => location.id === selectedLocationId)
    : null;

  if (isLoading) {
    return <div className="h-10 w-[200px] animate-pulse bg-muted rounded-md"></div>;
  }

  if (error) {
    return <div className="text-destructive text-sm">Error: {error}</div>;
  }

  if (locations.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {selectedLocation ? selectedLocation.name : "All Locations"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search location..." />
          <CommandEmpty>No location found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                onLocationChange(null);
                setOpen(false);
              }}
              className="cursor-pointer"
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !selectedLocationId ? "opacity-100" : "opacity-0"
                )}
              />
              All Locations
            </CommandItem>
            {locations.map((location) => (
              <CommandItem
                key={location.id}
                onSelect={() => {
                  onLocationChange(location.id);
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedLocationId === location.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {location.name}
                {location.city && (
                  <span className="ml-1 text-muted-foreground">({location.city})</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 