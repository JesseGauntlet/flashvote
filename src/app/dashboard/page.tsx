import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default async function DashboardPage() {
  const session = await requireSession();
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
    <DashboardLayout>
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
                  You haven't created any events yet. Click "New Event" to get started.
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
                  You don't have admin access to any events created by others.
                </p>
              )}
              
              {!adminError && adminEvents && adminEvents.length > 0 && (
                <ul className="space-y-2">
                  {adminEvents.map((admin) => {
                    if (!admin.events) return null;
                    
                    return (
                      <li key={admin.event_id} className="border rounded-md p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{admin.events.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              /{admin.events.slug} ({admin.role})
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