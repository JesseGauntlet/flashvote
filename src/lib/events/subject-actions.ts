'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CreateSubjectData {
  label: string;
  pos_label: string;
  neg_label: string;
  event_id: string;
  item_id?: string | null;
}

export async function createSubject(data: CreateSubjectData) {
  const supabase = await createClient();
  
  // Get the current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to create a subject');
  }
  
  // Check if the user has permission to add subjects to this event
  const { data: event } = await supabase
    .from('events')
    .select('owner_id')
    .eq('id', data.event_id)
    .single();
    
  if (!event || event.owner_id !== session.user.id) {
    // Also check if user is an admin for this event
    const { data: adminRole } = await supabase
      .from('admins')
      .select('role')
      .eq('event_id', data.event_id)
      .eq('user_id', session.user.id)
      .single();
      
    if (!adminRole || adminRole.role === 'viewer') {
      throw new Error('You do not have permission to add subjects to this event');
    }
  }
  
  // If item_id is provided, check if it belongs to the event
  if (data.item_id) {
    const { data: item } = await supabase
      .from('items')
      .select('event_id')
      .eq('id', data.item_id)
      .single();
      
    if (!item || item.event_id !== data.event_id) {
      throw new Error('The specified item does not belong to this event');
    }
  }
  
  // Create the subject
  const { data: subject, error } = await supabase
    .from('subjects')
    .insert({
      label: data.label,
      pos_label: data.pos_label,
      neg_label: data.neg_label,
      event_id: data.event_id,
      item_id: data.item_id || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating subject:', error);
    throw new Error(error.message || 'Failed to create subject');
  }
  
  // Revalidate the event page
  revalidatePath(`/dashboard/events/${data.event_id}`);
  if (data.item_id) {
    revalidatePath(`/dashboard/events/${data.event_id}/items/${data.item_id}`);
  }
  
  return subject;
}

export async function updateSubject(subjectId: string, data: Partial<Omit<CreateSubjectData, 'event_id' | 'item_id'>>) {
  const supabase = await createClient();
  
  // Get the current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to update a subject');
  }
  
  // Get the subject to check permissions and get event_id
  const { data: subject } = await supabase
    .from('subjects')
    .select('event_id, item_id')
    .eq('id', subjectId)
    .single();
    
  if (!subject) {
    throw new Error('Subject not found');
  }
  
  // Check if the user has permission to update subjects in this event
  const { data: event } = await supabase
    .from('events')
    .select('owner_id')
    .eq('id', subject.event_id)
    .single();
    
  if (!event || event.owner_id !== session.user.id) {
    // Also check if user is an admin for this event
    const { data: adminRole } = await supabase
      .from('admins')
      .select('role')
      .eq('event_id', subject.event_id)
      .eq('user_id', session.user.id)
      .single();
      
    if (!adminRole || adminRole.role === 'viewer') {
      throw new Error('You do not have permission to update subjects in this event');
    }
  }
  
  // Update the subject
  const { error } = await supabase
    .from('subjects')
    .update(data)
    .eq('id', subjectId);
  
  if (error) {
    console.error('Error updating subject:', error);
    throw new Error(error.message || 'Failed to update subject');
  }
  
  // Revalidate the event page
  revalidatePath(`/dashboard/events/${subject.event_id}`);
  if (subject.item_id) {
    revalidatePath(`/dashboard/events/${subject.event_id}/items/${subject.item_id}`);
  }
  
  return { success: true };
}

export async function deleteSubject(subjectId: string) {
  const supabase = await createClient();
  
  // Get the current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('You must be logged in to delete a subject');
  }
  
  // Get the subject to check permissions and get event_id
  const { data: subject } = await supabase
    .from('subjects')
    .select('event_id, item_id')
    .eq('id', subjectId)
    .single();
    
  if (!subject) {
    throw new Error('Subject not found');
  }
  
  // Check if the user has permission to delete subjects in this event
  const { data: event } = await supabase
    .from('events')
    .select('owner_id')
    .eq('id', subject.event_id)
    .single();
    
  if (!event || event.owner_id !== session.user.id) {
    // Also check if user is an admin for this event
    const { data: adminRole } = await supabase
      .from('admins')
      .select('role')
      .eq('event_id', subject.event_id)
      .eq('user_id', session.user.id)
      .single();
      
    if (!adminRole || adminRole.role === 'viewer') {
      throw new Error('You do not have permission to delete subjects in this event');
    }
  }
  
  // Delete the subject
  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', subjectId);
  
  if (error) {
    console.error('Error deleting subject:', error);
    throw new Error(error.message || 'Failed to delete subject');
  }
  
  // Revalidate the event page
  revalidatePath(`/dashboard/events/${subject.event_id}`);
  if (subject.item_id) {
    revalidatePath(`/dashboard/events/${subject.event_id}/items/${subject.item_id}`);
  }
  
  return { success: true };
} 