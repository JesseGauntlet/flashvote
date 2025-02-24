import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';
import { notFound } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { EventDetailsForm } from './EventDetailsForm';
import { SubjectsList } from './SubjectsList';
import { ItemsList } from './ItemsList';
import { Toaster } from 'sonner';

interface EventPageProps {
  params: {
    id: string;
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const session = await requireSession();
  const supabase = await createClient();
  
  // Fetch event details
  const { data: event, error } = await supabase
    .from('events')
    .select('id, title, slug, owner_id, is_premium, archived_at, created_at')
    .eq('id', params.id)
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
      .eq('event_id', params.id)
      .eq('user_id', session.user.id)
      .single();
      
    if (!adminRole) {
      notFound();
    }
  }
  
  // Fetch subjects for this event (directly under the event, not under items)
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, label, pos_label, neg_label')
    .eq('event_id', params.id)
    .is('item_id', null);
  
  // Fetch items for this event
  const { data: items } = await supabase
    .from('items')
    .select('id, name, item_slug')
    .eq('event_id', params.id);
  
  return (
    <DashboardLayout>
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
        
        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Event Details</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 