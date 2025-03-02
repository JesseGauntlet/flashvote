'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
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

// Define the form schema using Zod
const formSchema = z.object({
  name: z.string().min(1, { message: 'Location name is required' }),
  address: z.string().optional(),
  city: z.string().optional(),
  zip_code: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

// Infer form values type from schema
type FormValues = z.infer<typeof formSchema>;

export default function EditLocationPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const locationId = params.locationId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [eventTitle, setEventTitle] = useState<string>('');
  const supabase = createClient();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      zip_code: '',
    },
  });

  // Fetch location and event details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch location data
        const { data: location, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq('id', locationId)
          .single();
          
        if (locationError) throw locationError;
        
        if (location) {
          // Check if location belongs to the event
          if (location.event_id !== eventId) {
            toast.error('This location does not belong to the current event');
            router.push(`/dashboard/events/${eventId}?tab=locations`);
            return;
          }
          
          // Set form values
          form.reset({
            name: location.name || '',
            address: location.address || '',
            city: location.city || '',
            zip_code: location.zip_code || '',
            lat: location.lat || undefined,
            lon: location.lon || undefined,
          });
          
          // Fetch event title
          const { data: event, error: eventError } = await supabase
            .from('events')
            .select('title')
            .eq('id', eventId)
            .single();
            
          if (eventError) throw eventError;
          if (event) setEventTitle(event.title);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load location data');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (eventId && locationId) {
      fetchData();
    }
  }, [eventId, locationId, supabase, form, router]);

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSaving(true);

      // Update the location
      const { error } = await supabase
        .from('locations')
        .update({
          name: data.name,
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
      router.push(`/dashboard/events/${eventId}?tab=locations`);
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update location');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/events/${eventId}?tab=locations`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Edit Location</h1>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
              <CardDescription>
                Edit location for {eventTitle || 'this event'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Downtown Store" {...field} disabled={isSaving} />
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
                          <Input placeholder="123 Main St" {...field} disabled={isSaving} />
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
                            <Input placeholder="Seattle" {...field} disabled={isSaving} />
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
                            <Input placeholder="98101" {...field} disabled={isSaving} />
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
                              disabled={isSaving} 
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
                              disabled={isSaving} 
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
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 