'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useProfile } from '@/lib/auth/hooks';

// Define the form schema using Zod
const formSchema = z.object({
  name: z.string().min(1, { message: 'Location name is required' }),
  event_id: z.string().min(1, { message: 'Event is required' }),
  address: z.string().optional(),
  city: z.string().optional(),
  zip_code: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

// Infer form values type from schema
type FormValues = z.infer<typeof formSchema>;

// Specify proper types for the admin events mapping, matching our fix in the edit page
type Event = {
  id: string;
  title: string;
  slug: string;
};

export default function NewLocationPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const { isCreator } = useProfile();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      event_id: '',
      address: '',
      city: '',
      zip_code: '',
    },
  });

  // Fetch available events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch events owned by the user
        const { data: ownedEvents, error: ownedEventsError } = await supabase
          .from('events')
          .select('id, title, slug');

        if (ownedEventsError) {
          throw new Error(ownedEventsError.message);
        }

        // Fetch events where user is an admin
        const { data: adminEvents, error: adminEventsError } = await supabase
          .from('admins')
          .select('event_id, events:event_id(id, title, slug)')
          .eq('role', 'editor');

        if (adminEventsError) {
          throw new Error(adminEventsError.message);
        }

        // Combine both lists
        const combinedEvents = [
          ...(ownedEvents || []),
          ...((adminEvents || [])
            .filter(admin => admin.events)
            .map(admin => {
              // Safely access nested properties
              const event = admin.events as unknown as { id: string; title: string; slug: string };
              return {
                id: event.id,
                title: event.title,
                slug: event.slug,
              };
            }))
        ];

        setEvents(combinedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
      }
    };

    fetchEvents();
  }, [supabase]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);

      // Insert the new location
      const { error } = await supabase
        .from('locations')
        .insert([
          {
            name: data.name,
            event_id: data.event_id,
            address: data.address || null,
            city: data.city || null,
            zip_code: data.zip_code || null,
            lat: data.lat || null,
            lon: data.lon || null,
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Location created successfully');
      router.push('/dashboard/locations');
      router.refresh();
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error('Failed to create location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout isCreator={isCreator}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/locations">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">New Location</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
            <CardDescription>
              Create a new location to track votes by specific places
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="event_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an event" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              {event.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The event this location will be associated with
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Downtown Store" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormDescription>
                        A descriptive name for this location
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Seattle" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="98101" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.000001"
                            placeholder="47.6062" 
                            value={field.value?.toString() || ''} 
                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            disabled={isLoading} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional coordinates for mapping
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lon"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.000001"
                            placeholder="-122.3321" 
                            value={field.value?.toString() || ''} 
                            onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            disabled={isLoading} 
                          />
                        </FormControl>
                        <FormDescription>
                          Optional coordinates for mapping
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Location'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 