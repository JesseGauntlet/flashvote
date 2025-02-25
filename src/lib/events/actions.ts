'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface CreateEventData {
  title: string;
  slug: string;
}

export async function createEvent(data: CreateEventData) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    throw new Error('You must be logged in to create an event');
  }
  
  // Validate the slug format (alphanumeric, hyphens, underscores only)
  const slugRegex = /^[a-z0-9-_]+$/;
  if (!slugRegex.test(data.slug)) {
    throw new Error('Slug can only contain lowercase letters, numbers, hyphens, and underscores');
  }
  
  // Check if the slug is already taken
  const { data: existingEvent } = await supabase
    .from('events')
    .select('id')
    .eq('slug', data.slug)
    .single();
    
  if (existingEvent) {
    throw new Error('This slug is already taken. Please choose another one.');
  }
  
  // Create the event
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      title: data.title,
      slug: data.slug,
      owner_id: user.id,
      is_premium: false, // Default to free tier
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating event:', error);
    throw new Error(error.message || 'Failed to create event');
  }
  
  // Revalidate the dashboard page to show the new event
  revalidatePath('/dashboard');
  
  // Redirect to the event management page
  redirect(`/dashboard/events/${event.id}`);
}

export async function updateEvent(eventId: string, data: Partial<CreateEventData>) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    throw new Error('You must be logged in to update an event');
  }
  
  // Check if the user has permission to update this event
  const { data: event } = await supabase
    .from('events')
    .select('owner_id')
    .eq('id', eventId)
    .single();
    
  if (!event || event.owner_id !== user.id) {
    // Also check if user is an admin for this event
    const { data: adminRole } = await supabase
      .from('admins')
      .select('role')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();
      
    if (!adminRole || adminRole.role === 'viewer') {
      throw new Error('You do not have permission to update this event');
    }
  }
  
  // If slug is being updated, validate it
  if (data.slug) {
    const slugRegex = /^[a-z0-9-_]+$/;
    if (!slugRegex.test(data.slug)) {
      throw new Error('Slug can only contain lowercase letters, numbers, hyphens, and underscores');
    }
    
    // Check if the new slug is already taken by another event
    const { data: existingEvent } = await supabase
      .from('events')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', eventId) // Exclude the current event
      .single();
      
    if (existingEvent) {
      throw new Error('This slug is already taken. Please choose another one.');
    }
  }
  
  // Update the event
  const { error } = await supabase
    .from('events')
    .update(data)
    .eq('id', eventId);
  
  if (error) {
    console.error('Error updating event:', error);
    throw new Error(error.message || 'Failed to update event');
  }
  
  // Revalidate the dashboard and event pages
  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/events/${eventId}`);
  
  return { success: true };
}

export async function archiveEvent(eventId: string) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    throw new Error('You must be logged in to archive an event');
  }
  
  // Check if the user has permission to archive this event
  const { data: event } = await supabase
    .from('events')
    .select('owner_id')
    .eq('id', eventId)
    .single();
    
  if (!event || event.owner_id !== user.id) {
    throw new Error('You do not have permission to archive this event');
  }
  
  // Archive the event by setting archived_at
  const { error } = await supabase
    .from('events')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', eventId);
  
  if (error) {
    console.error('Error archiving event:', error);
    throw new Error(error.message || 'Failed to archive event');
  }
  
  // Revalidate the dashboard page
  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/events/${eventId}`);
  
  return { success: true };
}

export async function unarchiveEvent(eventId: string) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    throw new Error('You must be logged in to unarchive an event');
  }
  
  // Check if the user has permission to unarchive this event
  const { data: event } = await supabase
    .from('events')
    .select('owner_id')
    .eq('id', eventId)
    .single();
    
  if (!event || event.owner_id !== user.id) {
    throw new Error('You do not have permission to unarchive this event');
  }
  
  // Unarchive the event by setting archived_at to null
  const { error } = await supabase
    .from('events')
    .update({ archived_at: null })
    .eq('id', eventId);
  
  if (error) {
    console.error('Error unarchiving event:', error);
    throw new Error(error.message || 'Failed to unarchive event');
  }
  
  // Revalidate the dashboard page
  revalidatePath('/dashboard');
  revalidatePath(`/dashboard/events/${eventId}`);
  
  return { success: true };
} 