'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateEvent, archiveEvent, unarchiveEvent } from '@/lib/events/actions';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

interface EventDetailsFormProps {
  event: Event;
}

export function EventDetailsForm({ event }: EventDetailsFormProps) {
  const [title, setTitle] = useState(event.title);
  const [slug, setSlug] = useState(event.slug);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Please enter a title for your event');
      return;
    }
    
    if (!slug.trim()) {
      toast.error('Please enter a slug for your event');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await updateEvent(event.id, { title, slug });
      toast.success('Event updated successfully');
    } catch (error) {
      toast.error('Error updating event', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleArchiveToggle = async () => {
    setIsArchiving(true);
    
    try {
      if (event.archived_at) {
        await unarchiveEvent(event.id);
        toast.success('Event unarchived successfully');
      } else {
        await archiveEvent(event.id);
        toast.success('Event archived successfully');
      }
    } catch (error) {
      toast.error('Error toggling archive status', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="slug">Event Slug</Label>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">flashvote.com/</span>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
              disabled={isSubmitting}
              className="flex-1"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Changing the slug will break existing links to this event.
          </p>
        </div>
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
      
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-2">Event Status</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {event.archived_at 
            ? 'This event is currently archived. Users can still view it, but voting is disabled.' 
            : 'This event is currently active. Users can vote on all subjects.'}
        </p>
        
        <Button 
          variant={event.archived_at ? 'default' : 'destructive'} 
          onClick={handleArchiveToggle}
          disabled={isArchiving}
        >
          {isArchiving 
            ? (event.archived_at ? 'Unarchiving...' : 'Archiving...') 
            : (event.archived_at ? 'Unarchive Event' : 'Archive Event')}
        </Button>
      </div>
    </div>
  );
} 