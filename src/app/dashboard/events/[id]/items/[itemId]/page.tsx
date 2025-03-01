import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase/server';
import { requireSession } from '@/lib/auth/session';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { SubjectsList } from '../../SubjectsList';
import { Toaster } from 'sonner';

interface ItemPageProps {
  params: Promise<{
    id: string;
    itemId: string;
  }>;
}

export default async function ItemPage({ params }: ItemPageProps) {
  // First, await the params object to ensure it's fully resolved
  const resolvedParams = await params;
  
  // Now it's safe to destructure
  const { id, itemId } = resolvedParams;
  
  const session = await requireSession();
  const supabase = await createClient();
  
  // Fetch event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, slug, owner_id')
    .eq('id', id)
    .single();
  
  if (eventError || !event) {
    notFound();
  }
  
  // Fetch item details
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('id, name, item_slug, image_url')
    .eq('id', itemId)
    .eq('event_id', id)
    .single();
  
  if (itemError || !item) {
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
  
  // Fetch subjects for this item
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, label, pos_label, neg_label, event_id, item_id, metadata, created_at')
    .eq('event_id', id)
    .eq('item_id', itemId);
  
  return (
    <DashboardLayout>
      <Toaster position="top-center" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/events/${id}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{item.name}</h1>
              <p className="text-muted-foreground">
                {event.title} / {item.item_slug}
              </p>
            </div>
          </div>
          
          <Link href={`/${event.slug}/${item.item_slug}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Public Page
            </Button>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Item Subjects</CardTitle>
            <CardDescription>
              Manage voting subjects for this item
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectsList 
              eventId={event.id} 
              subjects={subjects || []} 
              itemId={item.id}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 