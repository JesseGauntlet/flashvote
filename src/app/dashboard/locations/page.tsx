'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, MapPin } from 'lucide-react';
import { BulkLocationUpload } from './BulkLocationUpload';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type EventInfo = {
  title: string;
  slug: string;
};

type LocationWithEvent = {
  id: string;
  name: string;
  city: string | null;
  zip_code: string | null;
  event_id: string;
  event: EventInfo;
};

export default function LocationsPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<LocationWithEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch events owned by the user
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('id, title, slug');
        
        if (eventsError) {
          throw new Error(`Error loading events: ${eventsError.message}`);
        }
        
        // Fetch events where user is an admin
        const { data: adminEvents, error: adminEventsError } = await supabase
          .from('admins')
          .select('event_id, events:event_id(id, title, slug)')
          .eq('role', 'editor');
        
        if (adminEventsError) {
          throw new Error(`Error loading admin events: ${adminEventsError.message}`);
        }
        
        // Combine both lists
        const allEventIds = [
          ...(events || []).map(event => event.id),
          ...((adminEvents || [])
            .filter(admin => admin.events)
            .map(admin => {
              // Safely access nested properties
              const event = admin.events as unknown as { id: string };
              return event.id;
            }))
        ];
        
        if (allEventIds.length === 0) {
          setLocations([]);
          setIsLoading(false);
          return;
        }
        
        // Fetch locations for all events the user has access to
        const { data: locationsData, error: locationsError } = await supabase
          .from('locations')
          .select('id, name, city, zip_code, event_id, event:event_id(title, slug)')
          .in('event_id', allEventIds)
          .order('name');
        
        if (locationsError) {
          throw new Error(`Error loading locations: ${locationsError.message}`);
        }
        
        setLocations(locationsData as unknown as LocationWithEvent[]);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLocations();
  }, [supabase]);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Locations</h1>
          <div className="flex gap-2">
            <BulkLocationUpload />
            <Link href="/dashboard/locations/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Location
              </Button>
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            <p>{error}</p>
          </div>
        )}
        
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-10 animate-pulse bg-muted rounded-md"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 animate-pulse bg-muted rounded-md"></div>
              ))}
            </div>
          </div>
        ) : !locations || locations.length === 0 ? (
          <div className="text-center p-12 border rounded-md">
            <h3 className="text-lg font-medium mb-2">No locations found</h3>
            <p className="text-muted-foreground mb-6">
              You haven&apos;t created any locations yet. Locations allow you to track votes by specific places.
            </p>
            <div className="flex justify-center gap-4">
              <BulkLocationUpload />
              <Link href="/dashboard/locations/new">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Location
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((locationWithEvent) => (
              <div key={locationWithEvent.id} className="border rounded-md p-4 hover:bg-muted/50">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {locationWithEvent.name}
                    </h3>
                    {locationWithEvent.city && (
                      <p className="text-sm text-muted-foreground">
                        {locationWithEvent.city}
                        {locationWithEvent.zip_code ? `, ${locationWithEvent.zip_code}` : ''}
                      </p>
                    )}
                    {locationWithEvent.event && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Event: {locationWithEvent.event.title}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/locations/${locationWithEvent.id}`}>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 