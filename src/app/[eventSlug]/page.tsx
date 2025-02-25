import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Subject } from '@/components/vote/Subject';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import { ClientLocationSelector } from '@/components/location/ClientLocationSelector';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
  const itemSubjectsByItemId: Record<string, { defaultSubject?: any, regularSubjects: any[] }> = {};
  
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
    <div className="container mx-auto px-4 py-12">
      <Toaster position="top-center" />
      
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{event.title}</h1>
        
        <div className="mb-8">
          <Suspense fallback={<div className="h-10 w-[200px] animate-pulse bg-muted rounded-md"></div>}>
            <ClientLocationSelector eventId={event.id} initialLocationId={locationId} />
          </Suspense>
        </div>
        
        {/* Event-level subjects */}
        {eventSubjects && eventSubjects.length > 0 ? (
          <div className="space-y-8 mb-12">
            <h2 className="text-xl font-semibold">Event Questions</h2>
            {eventSubjects.map((subject) => (
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
          <div className="text-center p-8 border rounded-md mb-12">
            <h3 className="text-lg font-medium mb-2">No event questions</h3>
            <p className="text-muted-foreground">
              There are no voting subjects available for this event yet.
            </p>
          </div>
        )}
        
        {/* Divider */}
        {items && items.length > 0 && (
          <div className="relative my-12">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">
                Items
              </span>
            </div>
          </div>
        )}
        
        {/* Items with their subjects */}
        {items && items.length > 0 && (
          <div className="space-y-6">
            {items.map((item) => {
              const { defaultSubject, regularSubjects } = itemSubjectsByItemId[item.id] || 
                { defaultSubject: undefined, regularSubjects: [] };
              
              return (
                <div 
                  key={item.id} 
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4 bg-muted/30">
                    <div className="flex justify-between items-center mb-2">
                      <Link 
                        href={`/${eventSlug}/${item.item_slug}`}
                        className="text-lg font-semibold hover:underline flex items-center gap-1"
                      >
                        {item.name}
                        <ArrowRight className="h-4 w-4 opacity-50" />
                      </Link>
                    </div>
                    
                    {/* Default subject (implicit rating) */}
                    {defaultSubject && (
                      <div className="p-1">
                        <Subject
                          key={defaultSubject.id}
                          id={defaultSubject.id}
                          label=""
                          posLabel={defaultSubject.pos_label}
                          negLabel={defaultSubject.neg_label}
                          locationId={locationId || undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* No items message */}
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