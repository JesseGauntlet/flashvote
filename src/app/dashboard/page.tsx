import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { requireSession, getCreatorStatus } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { redirect } from 'next/navigation';

// Define a proper type for admin events based on the query result
interface AdminEvent {
  event_id: string;
  role: string;
  events: {
    id: string;
    title: string;
    slug: string;
    created_at: string;
  }[];
}

export default async function DashboardPage() {
  // Check if user is a creator, redirect if not
  const session = await requireSession();
  const isCreator = await getCreatorStatus();
  
  if (!isCreator) {
    redirect('/dashboard/settings');
  }
  
  const supabase = await createClient();
  
  // Fetch events owned by the user
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, slug, created_at')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false });
  
  // Fetch events where user is an admin but not owner
  const { data: adminEvents, error: adminError } = await supabase
    .from('admins')
    .select('event_id, role, events:event_id(id, title, slug, created_at)')
    .eq('user_id', session.user.id);
  
  return (
    <DashboardLayout isCreator={isCreator}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Link href="/dashboard/events/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Events</CardTitle>
              <CardDescription>
                Events you have created
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-destructive">Error loading events: {error.message}</p>
              )}
              
              {!error && events && events.length === 0 && (
                <p className="text-muted-foreground">
                  You haven&apos;t created any events yet.
                </p>
              )}
              
              {!error && events && events.length > 0 && (
                <ul className="space-y-2">
                  {events.map((event) => (
                    <li key={event.id} className="border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">/{event.slug}</p>
                        </div>
                        <Link href={`/dashboard/events/${event.id}`}>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Administered Events</CardTitle>
              <CardDescription>
                Events where you have admin access
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adminError && (
                <p className="text-destructive">Error loading admin events: {adminError.message}</p>
              )}
              
              {!adminError && (!adminEvents || adminEvents.length === 0) && (
                <p className="text-muted-foreground">
                  You don&apos;t have admin access to any events created by others.
                </p>
              )}
              
              {!adminError && adminEvents && adminEvents.length > 0 && (
                <ul className="space-y-2">
                  {adminEvents.map((admin: AdminEvent) => {
                    // Use the first event from the events array if available
                    if (!admin.events || admin.events.length === 0) return null;
                    const eventInfo = admin.events[0];
                    
                    return (
                      <li key={admin.event_id} className="border rounded-md p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{eventInfo.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              /{eventInfo.slug} ({admin.role})
                            </p>
                          </div>
                          <Link href={`/dashboard/events/${admin.event_id}`}>
                            <Button variant="outline" size="sm">
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 