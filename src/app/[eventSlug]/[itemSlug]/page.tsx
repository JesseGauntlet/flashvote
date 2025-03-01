import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Subject } from '@/components/vote/Subject';
import { Suspense } from 'react';
import { Toaster } from 'sonner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ClientLocationSelector } from '@/components/location/ClientLocationSelector';
import { Card, CardContent } from '@/components/ui/card';

interface ItemPageProps {
  params: {
    eventSlug: string;
    itemSlug: string;
  };
  searchParams: {
    location?: string;
  };
}

export default async function ItemPage({ params, searchParams }: ItemPageProps) {
  // Destructure params and searchParams
  const { eventSlug, itemSlug } = params;
  const { location } = searchParams;
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
  
  // Fetch item details
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id, name, item_slug, image_url')
    .eq('event_id', event.id)
    .eq('item_slug', itemSlug)
    .single();
  
  if (itemError || !item) {
    notFound();
  }
  
  // Fetch subjects for this item
  const { data: subjects, error: subjectsError } = await supabase
    .from('subjects')
    .select('id, label, pos_label, neg_label, metadata')
    .eq('event_id', event.id)
    .eq('item_id', item.id);
  
  if (subjectsError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">{item.name}</h1>
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            Error loading subjects: {subjectsError.message}
          </div>
        </div>
      </div>
    );
  }
  
  // Separate default subject (empty label) from regular subjects
  const defaultSubject = subjects?.find(subject => 
    !subject.label || (subject.metadata && subject.metadata.is_default === true)
  );
  
  const regularSubjects = subjects?.filter(subject => 
    subject.label && (!subject.metadata || subject.metadata.is_default !== true)
  ) || [];
  
  return (
    <div className="container mx-auto px-4 py-12">
      <Toaster position="top-center" />
      
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/${eventSlug}`}>
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {event.title}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{item.name}</h1>
        </div>
        
        <div className="mb-8">
          <Suspense fallback={<div className="h-10 w-[200px] animate-pulse bg-muted rounded-md"></div>}>
            <ClientLocationSelector eventId={event.id} initialLocationId={locationId} />
          </Suspense>
        </div>
        
        {/* Default subject (implicit rating) */}
        {defaultSubject && (
          <Card className="mb-8 bg-muted/30 overflow-hidden">
            <CardContent className="p-4">
              <div className="mb-2 text-lg font-medium">Rate this item</div>
              <Subject
                key={defaultSubject.id}
                id={defaultSubject.id}
                label=""
                posLabel={defaultSubject.pos_label}
                negLabel={defaultSubject.neg_label}
                locationId={locationId || undefined}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Regular subjects with questions */}
        {regularSubjects.length > 0 ? (
          <div>
            <div className="space-y-4">
              {regularSubjects.map((subject) => (
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
          </div>
        ) : defaultSubject ? null : (
          <div className="text-center p-12 border rounded-md">
            <h3 className="text-lg font-medium mb-2">No subjects found</h3>
            <p className="text-muted-foreground">
              There are no voting subjects available for this item yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 