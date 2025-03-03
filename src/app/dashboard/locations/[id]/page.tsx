'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2 } from 'lucide-react';
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
import { useParams } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

type Event = {
  id: string;
  title: string;
  slug: string;
};

type Location = {
  id: string;
  name: string;
  event_id: string;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  lat: number | null;
  lon: number | null;
};

export default function EditLocationPage() {
  const router = useRouter();
  const params = useParams();
  const locationId = params.id as string;
  const [events, setEvents] = useState<Event[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const supabase = createClient();

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

  // Fetch location data
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('id', locationId)
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          setLocation(data);
          
          // Set form values
          form.reset({
            name: data.name,
            event_id: data.event_id,
            address: data.address || '',
            city: data.city || '',
            zip_code: data.zip_code || '',
            lat: data.lat || undefined,
            lon: data.lon || undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching location:', error);
        toast.error('Failed to load location details');
      } finally {
        setIsLoading(false);
      }
    };

    if (locationId) {
      fetchLocation();
    }
  }, [locationId, supabase, form]);

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

      // Update the location
      const { error } = await supabase
        .from('locations')
        .update({
          name: data.name,
          event_id: data.event_id,
          address: data.address || null,
          city: data.city || null,
          zip_code: data.zip_code || null,
          lat: data.lat || null,
          lon: data.lon || null,
        })
        .eq('id', locationId);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Location updated successfully');
      router.push('/dashboard/locations');
      router.refresh();
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle location deletion
  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      // Check if location has associated votes
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('id')
        .eq('location_id', locationId)
        .limit(1);

      if (votesError) {
        throw new Error(votesError.message);
      }

      // If votes exist, warn the user
      if (votes && votes.length > 0) {
        toast.error('Cannot delete location with existing votes');
        return;
      }

      // Delete the location
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Location deleted successfully');
      router.push('/dashboard/locations');
      router.refresh();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading && !location) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/dashboard/locations">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Edit Location</h1>
            </div>
          </div>
          <div className="h-[400px] w-full animate-pulse bg-muted rounded-md"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/locations">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Edit Location</h1>
          </div>
          
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={isLoading || isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the location. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
            <CardDescription>
              Edit details for this location
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
                        disabled={isLoading || isDeleting}
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
                        The event this location is associated with
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
                        <Input placeholder="e.g. Downtown Store" {...field} disabled={isLoading || isDeleting} />
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
                        <Input placeholder="123 Main St" {...field} disabled={isLoading || isDeleting} />
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
                          <Input placeholder="Seattle" {...field} disabled={isLoading || isDeleting} />
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
                          <Input placeholder="98101" {...field} disabled={isLoading || isDeleting} />
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
                            disabled={isLoading || isDeleting} 
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
                            disabled={isLoading || isDeleting} 
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
                  <Button type="submit" disabled={isLoading || isDeleting}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
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