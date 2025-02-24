import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { requireSession } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default async function EventsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  
  // Fetch events owned by the user
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, slug, created_at, is_premium, archived_at')
    .eq('owner_id', session.user.id)
    .order('created_at', { ascending: false });
  
  // Fetch events where user is an admin but not owner
  const { data: adminEvents, error: adminError } = await supabase
    .from('admins')
    .select('event_id, role, events:event_id(id, title, slug, created_at, is_premium, archived_at)')
    .eq('user_id', session.user.id);
  
  // Combine both lists
  const allEvents = [
    ...(events || []).map(event => ({
      ...event,
      role: 'owner',
    })),
    ...(adminEvents || [])
      .filter(admin => admin.events) // Filter out any null events
      .map(admin => ({
        ...admin.events,
        role: admin.role,
      })),
  ];
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Events</h1>
          <Link href="/dashboard/events/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
        
        {(error || adminError) && (
          <div className="bg-destructive/10 p-4 rounded-md text-destructive">
            {error && <p>Error loading your events: {error.message}</p>}
            {adminError && <p>Error loading admin events: {adminError.message}</p>}
          </div>
        )}
        
        {allEvents.length === 0 ? (
          <div className="text-center p-12 border rounded-md">
            <h3 className="text-lg font-medium mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">
              You haven't created any events yet or been added as an admin to any events.
            </p>
            <Link href="/dashboard/events/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Event
              </Button>
            </Link>
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Title</th>
                  <th className="text-left p-3 font-medium">Slug</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Created</th>
                  <th className="text-right p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-muted/50">
                    <td className="p-3">{event.title}</td>
                    <td className="p-3">/{event.slug}</td>
                    <td className="p-3 capitalize">{event.role}</td>
                    <td className="p-3">
                      {event.archived_at ? (
                        <span className="text-muted-foreground">Archived</span>
                      ) : (
                        <span className="text-green-600">Active</span>
                      )}
                    </td>
                    <td className="p-3">
                      {new Date(event.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/${event.slug}`} target="_blank">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/dashboard/events/${event.id}`}>
                          <Button size="sm">
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 