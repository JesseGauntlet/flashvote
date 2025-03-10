'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { createEvent } from '@/lib/events/actions';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/auth/hooks';

export default function NewEventPage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { isCreator } = useProfile();

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
      await createEvent({
        title: title.trim(),
        slug: slug.trim(),
      });
      toast.success('Event created successfully');
      router.push('/dashboard/events');
    } catch (error) {
      toast.error('Error creating event', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
      setIsSubmitting(false);
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Auto-generate slug from title if slug is empty
    if (!slug) {
      setSlug(
        newTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  return (
    <DashboardLayout isCreator={isCreator}>
      <Toaster position="top-center" />
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create New Event</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Create a new FlashVote event. Users will access it at flashvote.com/[slug].
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Costco Product Feedback"
                  value={title}
                  onChange={handleTitleChange}
                  disabled={isSubmitting}
                />
                <p className="text-sm text-muted-foreground">
                  This will be displayed at the top of your event page.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Event Slug</Label>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">flashvote.com/</span>
                  <Input
                    id="slug"
                    placeholder="e.g., costco"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    disabled={isSubmitting}
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This will be the URL path for your event. Use only lowercase letters, numbers, hyphens, and underscores.
                </p>
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Creating Event...' : 'Create Event'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 