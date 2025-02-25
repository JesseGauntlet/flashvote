import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Subject } from '@/components/vote/Subject';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { ClientLocationSelector } from '@/components/location/ClientLocationSelector';

interface EventPageProps {
  params: {
    eventSlug: string;
  };
  searchParams: {
    location?: string;
  };
}

export default async function EventPage({ params, searchParams }: EventPageProps) {
  // First, await both params and searchParams to ensure they're fully resolved
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  // Now it's safe to destructure them
  const { eventSlug } = resolvedParams;
  const { location } = resolvedSearchParams;
  const locationId = location || null;
  
  const supabase = await createClient();
  
  // Fetch event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, owner_id, is_premium, archived_at')
    .eq('slug', eventSlug)
    .single();
  
  if (eventError || !event) {
    notFound();
  }
  
  // Check if event is archived
  if (event.archived_at) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-6">{event.title}</h1>
          <div className="bg-muted p-8 rounded-lg">
            <h2 className="text-xl font-medium mb-2">This event has been archived</h2>
            <p className="text-muted-foreground">
              This voting event is no longer active. Thank you for your participation.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Fetch subjects for this event
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, label, pos_label, neg_label')
    .eq('event_id', event.id)
    .is('item_id', null); // Only get subjects directly under the event, not under items
  
  if (subjectsError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{event.title}</h1>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            Error loading subjects: {subjectsError.message}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-12">
      <Toaster position="top-center" />
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{event.title}</h1>
        
        <div className="mb-8">
          <Suspense fallback={<div className="h-10 w-[200px] animate-pulse bg-muted rounded-md"></div>}>
            <ClientLocationSelector eventId={event.id} initialLocationId={locationId} />
          </Suspense>
        </div>
        
        {subjects && subjects.length > 0 ? (
          <div className="space-y-8">
            {subjects.map((subject) => (
              <Subject
                key={subject.id}
                id={subject.id}
                label={subject.label}
                posLabel={subject.pos_label}
                negLabel={subject.neg_label}
                locationId={locationId || undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border rounded-md">
            <h3 className="text-lg font-medium mb-2">No subjects found</h3>
            <p className="text-muted-foreground">
              There are no voting subjects available for this event yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 