import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, MapPin } from 'lucide-react';

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

export default async function LocationsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  
  // Fetch events owned by the user or where user is an admin
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, slug')
    .eq('owner_id', session.user.id);
  
  const { data: adminEvents, error: adminEventsError } = await supabase
    .from('admins')
    .select('event_id, events:event_id(id, title, slug)')
    .eq('user_id', session.user.id);
  
  // Combine both lists
  const allEventIds = [
    ...(events || []).map(event => event.id),
    ...(adminEvents || [])
      .filter(admin => admin.events)
      .map(admin => admin.event_id)
  ];
  
  // Fetch locations for all events the user has access to
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, name, city, zip_code, event_id, event:event_id(title, slug)')
    .in('event_id', allEventIds)
    .order('name');
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Locations</h1>
          <Link href="/dashboard/locations/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Location
            </Button>
          </Link>
        </div>
        
        {(eventsError || adminEventsError || locationsError) && (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {eventsError && <p>Error loading events: {eventsError.message}</p>}
            {adminEventsError && <p>Error loading admin events: {adminEventsError.message}</p>}
            {locationsError && <p>Error loading locations: {locationsError.message}</p>}
          </div>
        )}
        
        {!locations || locations.length === 0 ? (
          <div className="text-center p-12 border rounded-md">
            <h3 className="text-lg font-medium mb-2">No locations found</h3>
            <p className="text-muted-foreground mb-6">
              You haven't created any locations yet. Locations allow you to track votes by specific places.
            </p>
            <Link href="/dashboard/locations/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Location
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => {
              const locationWithEvent = location as unknown as LocationWithEvent;
              return (
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
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 