import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase/server';
import { requireSession, getCreatorStatus } from '@/lib/auth/session';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { EventDetailsForm } from './EventDetailsForm';
import { SubjectsList } from './SubjectsList';
import { ItemsList } from './ItemsList';
import LocationsList from './LocationsList';
import { Toaster } from 'sonner';

interface EventPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

// Types are defined in ./types.d.ts and used by the imported components

export default async function EventPage({ params, searchParams }: EventPageProps) {
  // Await params and searchParams since they're now Promises in Next.js 15+
  const { id } = await params;
  const { tab } = await searchParams;
  const tabParam = tab || 'event';
  
  const session = await requireSession();
  const isCreator = await getCreatorStatus();
  const supabase = await createClient();
  
  // Fetch event details
  const { data: event, error } = await supabase
    .from('events')
    .select('id, title, slug, owner_id, is_premium, archived_at, metadata, created_at, updated_at')
    .eq('id', id)
    .single();
  
  if (error || !event) {
    notFound();
  }
  
  // Check if user has permission to view this event
  if (event.owner_id !== session.user.id) {
    // Check if user is an admin for this event
    const { data: adminRole } = await supabase
      .from('admins')
      .select('role')
      .eq('event_id', id)
      .eq('user_id', session.user.id)
      .single();
      
    if (!adminRole) {
      notFound();
    }
  }
  
  // Fetch subjects for this event
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .eq('event_id', id)
    .order('name');
  
  // Fetch items for this event
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('event_id', id)
    .order('name');
  
  // Fetch locations for this event
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('event_id', id)
    .order('name');
  
  return (
    <DashboardLayout isCreator={isCreator}>
      <Toaster position="top-center" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">{event.title}</h1>
          </div>
          
          <Link href={`/${event.slug}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Public Page
            </Button>
          </Link>
        </div>
        
        <Tabs defaultValue={tabParam} className="space-y-4">
          <TabsList>
            <TabsTrigger value="event">Event Details</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
          </TabsList>
          
          <TabsContent value="event">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>
                  Update your event information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventDetailsForm event={event} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>Subjects</CardTitle>
                <CardDescription>
                  Manage voting subjects for this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubjectsList eventId={event.id} subjects={subjects || []} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>
                  Manage items for this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ItemsList eventId={event.id} items={items || []} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Locations</CardTitle>
                <CardDescription>
                  Manage voting locations for this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LocationsList eventId={id} locations={locations || []} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 