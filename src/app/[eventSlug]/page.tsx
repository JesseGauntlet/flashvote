import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Subject } from '@/components/vote/Subject';
import { ClientLocationSelector } from '@/components/location/ClientLocationSelector';
import { PublicItemsList } from './PublicItemsList';

interface EventPageProps {
  params: Promise<{
    eventSlug: string;
  }>;
  searchParams: Promise<{
    location?: string;
  }>;
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
  
  // Fetch subjects for this event (directly under the event, not under items)
  const { data: eventSubjects, error: eventSubjectsError } = await supabase
    .from('subjects')
    .select('id, label, pos_label, neg_label')
    .eq('event_id', event.id)
    .is('item_id', null);
  
  // Fetch items for this event
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('id, name, item_slug')
    .eq('event_id', event.id);
  
  // Fetch subjects for all items under this event
  const { data: itemSubjects, error: itemSubjectsError } = await supabase
    .from('subjects')
    .select('id, label, pos_label, neg_label, item_id, metadata')
    .eq('event_id', event.id)
    .not('item_id', 'is', null);
  
  if (eventSubjectsError || itemsError || itemSubjectsError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{event.title}</h1>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            Error loading data: {eventSubjectsError?.message || itemsError?.message || itemSubjectsError?.message}
          </div>
        </div>
      </div>
    );
  }
  
  // Group item subjects by item_id for easier rendering
  // Separate default subjects (empty label) from regular subjects
  const itemSubjectsByItemId: Record<string, { 
    defaultSubject?: { 
      id: string;
      label: string;
      pos_label: string;
      neg_label: string;
      locationId?: string;
    }, 
    regularSubjects: Array<{
      id: string;
      label: string;
      pos_label: string;
      neg_label: string;
      locationId?: string;
    }> 
  }> = {};
  
  (itemSubjects || []).forEach((subject) => {
    if (!itemSubjectsByItemId[subject.item_id]) {
      itemSubjectsByItemId[subject.item_id] = { regularSubjects: [] };
    }
    
    // Check if this is a default subject (empty label or metadata.is_default)
    const isDefault = !subject.label || 
      (subject.metadata && subject.metadata.is_default === true);
    
    if (isDefault) {
      itemSubjectsByItemId[subject.item_id].defaultSubject = subject;
    } else {
      itemSubjectsByItemId[subject.item_id].regularSubjects.push(subject);
    }
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold mb-6">{event.title}</h1>
        
        <ClientLocationSelector eventId={event.id} initialLocationId={locationId} />
        
        {/* Event-level subjects */}
        {eventSubjects && eventSubjects.length > 0 && (
          <div className="space-y-4 mb-8">
            
            {eventSubjects.map(subject => (
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
        )}
        
        {/* Item list with their subjects */}
        {items && (
          <PublicItemsList
            items={items}
            eventSlug={eventSlug}
            itemSubjectsByItemId={itemSubjectsByItemId}
            locationId={locationId}
          />
        )}
        
        {/* Show "No content" only if both event subjects and items are empty */}
        {(!items || items.length === 0) && (!eventSubjects || eventSubjects.length === 0) && (
          <div className="text-center p-12 border rounded-md">
            <h3 className="text-lg font-medium mb-2">No content found</h3>
            <p className="text-muted-foreground">
              There are no voting subjects or items available for this event yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 