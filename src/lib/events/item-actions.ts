'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface CreateItemData {
  event_id: string;
  item_slug: string;
  name: string;
  item_id?: string;
  category?: string;
  image_url?: string;
}

export async function createItem(data: CreateItemData) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    throw new Error('You must be logged in to create an item');
  }
  
  // Check if the user has permission to add items to this event
  const { data: event } = await supabase
    .from('events')
    .select('owner_id, slug')
    .eq('id', data.event_id)
    .single();
    
  if (!event) {
    throw new Error('Event not found');
  }
  
  if (event.owner_id !== user.id) {
    // Also check if user is an admin for this event
    const { data: adminRole } = await supabase
      .from('admins')
      .select('role')
      .eq('event_id', data.event_id)
      .eq('user_id', user.id)
      .single();
      
    if (!adminRole || adminRole.role === 'viewer') {
      throw new Error('You do not have permission to add items to this event');
    }
  }
  
  // Validate the item slug format (alphanumeric, hyphens, underscores only)
  const slugRegex = /^[a-z0-9-_]+$/;
  if (!slugRegex.test(data.item_slug)) {
    throw new Error('Item slug can only contain lowercase letters, numbers, hyphens, and underscores');
  }
  
  // Check if the item slug is already taken for this event
  const { data: existingItem } = await supabase
    .from('items')
    .select('id')
    .eq('event_id', data.event_id)
    .eq('item_slug', data.item_slug)
    .single();
    
  if (existingItem) {
    throw new Error('This item slug is already taken for this event. Please choose another one.');
  }
  
  // Create the item
  const { data: item, error } = await supabase
    .from('items')
    .insert({
      event_id: data.event_id,
      item_slug: data.item_slug,
      name: data.name,
      item_id: data.item_id || null,
      category: data.category || null,
      image_url: data.image_url || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating item:', error);
    throw new Error(error.message || 'Failed to create item');
  }
  
  // Automatically create a default subject for this item (implicit rating)
  const { error: subjectError } = await supabase
    .from('subjects')
    .insert({
      label: '', // Empty label indicates this is an implicit rating
      pos_label: 'Recommend',
      neg_label: 'Not Recommended',
      event_id: data.event_id,
      item_id: item.id,
      metadata: { is_default: true } // Mark this as the default subject
    });
  
  if (subjectError) {
    console.error('Error creating default subject for item:', subjectError);
    // We don't throw here to avoid blocking item creation if subject creation fails
  }
  
  // Revalidate the event page
  revalidatePath(`/dashboard/events/${data.event_id}`);
  if (event) {
    revalidatePath(`/${event.slug}`);
  }
  
  // Redirect to the item management page
  redirect(`/dashboard/events/${data.event_id}/items/${item.id}`);
}

export async function updateItem(itemId: string, data: Partial<Omit<CreateItemData, 'event_id'>>) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    throw new Error('You must be logged in to update an item');
  }
  
  // Get the item to check permissions and get event_id
  const { data: item } = await supabase
    .from('items')
    .select('event_id, item_slug')
    .eq('id', itemId)
    .single();
    
  if (!item) {
    throw new Error('Item not found');
  }
  
  // Check if the user has permission to update items in this event
  const { data: event } = await supabase
    .from('events')
    .select('owner_id, slug')
    .eq('id', item.event_id)
    .single();
    
  if (!event || event.owner_id !== user.id) {
    // Also check if user is an admin for this event
    const { data: adminRole } = await supabase
      .from('admins')
      .select('role')
      .eq('event_id', item.event_id)
      .eq('user_id', user.id)
      .single();
      
    if (!adminRole || adminRole.role === 'viewer') {
      throw new Error('You do not have permission to update items in this event');
    }
  }
  
  // If item_slug is being updated, validate it
  if (data.item_slug) {
    const slugRegex = /^[a-z0-9-_]+$/;
    if (!slugRegex.test(data.item_slug)) {
      throw new Error('Item slug can only contain lowercase letters, numbers, hyphens, and underscores');
    }
    
    // Check if the new slug is already taken by another item in this event
    const { data: existingItem } = await supabase
      .from('items')
      .select('id')
      .eq('event_id', item.event_id)
      .eq('item_slug', data.item_slug)
      .neq('id', itemId) // Exclude the current item
      .single();
      
    if (existingItem) {
      throw new Error('This item slug is already taken for this event. Please choose another one.');
    }
  }
  
  // Update the item
  const { error } = await supabase
    .from('items')
    .update(data)
    .eq('id', itemId);
  
  if (error) {
    console.error('Error updating item:', error);
    throw new Error(error.message || 'Failed to update item');
  }
  
  // Revalidate the event and item pages
  revalidatePath(`/dashboard/events/${item.event_id}`);
  revalidatePath(`/dashboard/events/${item.event_id}/items/${itemId}`);
  if (event) {
    revalidatePath(`/${event.slug}`);
    revalidatePath(`/${event.slug}/${data.item_slug || item.item_slug}`);
  }
  
  return { success: true };
}

export async function deleteItem(itemId: string) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    throw new Error('You must be logged in to delete an item');
  }
  
  // Get the item to check permissions and get event_id
  const { data: item } = await supabase
    .from('items')
    .select('event_id, item_slug')
    .eq('id', itemId)
    .single();
    
  if (!item) {
    throw new Error('Item not found');
  }
  
  // Check if the user has permission to delete items in this event
  const { data: event } = await supabase
    .from('events')
    .select('owner_id, slug')
    .eq('id', item.event_id)
    .single();
    
  if (!event || event.owner_id !== user.id) {
    // Also check if user is an admin for this event
    const { data: adminRole } = await supabase
      .from('admins')
      .select('role')
      .eq('event_id', item.event_id)
      .eq('user_id', user.id)
      .single();
      
    if (!adminRole || adminRole.role === 'viewer') {
      throw new Error('You do not have permission to delete items in this event');
    }
  }
  
  // Delete the item
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId);
  
  if (error) {
    console.error('Error deleting item:', error);
    throw new Error(error.message || 'Failed to delete item');
  }
  
  // Revalidate the event page
  revalidatePath(`/dashboard/events/${item.event_id}`);
  if (event) {
    revalidatePath(`/${event.slug}`);
  }
  
  // Redirect to the event management page
  redirect(`/dashboard/events/${item.event_id}`);
}

export interface CsvItemData {
  item_slug: string;
  name: string;
  item_id?: string;
  category?: string;
}

export interface BulkCreateItemsResult {
  successful: number;
  failed: {
    row: number;
    item: CsvItemData;
    error: string;
  }[];
  redirectToItem?: string; // ID of the first created item if any
}

export async function bulkCreateItems(eventId: string, items: CsvItemData[]): Promise<BulkCreateItemsResult> {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (!user || userError) {
    throw new Error('You must be logged in to create items');
  }
  
  // Check if the user has permission to add items to this event
  const { data: event } = await supabase
    .from('events')
    .select('owner_id, slug')
    .eq('id', eventId)
    .single();
    
  if (!event) {
    throw new Error('Event not found');
  }

  // Check for existing item slugs to avoid duplicates
  const { data: existingItems } = await supabase
    .from('items')
    .select('item_slug')
    .eq('event_id', eventId);
  
  const existingSlugs = new Set(existingItems?.map(item => item.item_slug) || []);
  
  const result: BulkCreateItemsResult = {
    successful: 0,
    failed: []
  };
  
  let firstCreatedItemId: string | null = null;
  
  // Process each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
      // Validate required fields
      if (!item.item_slug || !item.name) {
        throw new Error('Item slug and name are required');
      }
      
      // Validate the item slug format
      const slugRegex = /^[a-z0-9-_]+$/;
      if (!slugRegex.test(item.item_slug)) {
        throw new Error('Item slug can only contain lowercase letters, numbers, hyphens, and underscores');
      }
      
      // Check for duplicate in existing data
      if (existingSlugs.has(item.item_slug)) {
        throw new Error(`Item slug "${item.item_slug}" already exists for this event`);
      }
      
      // Add to existing slugs to prevent duplicates within the batch
      existingSlugs.add(item.item_slug);
      
      // Create the item
      const { data: newItem, error } = await supabase
        .from('items')
        .insert({
          event_id: eventId,
          item_slug: item.item_slug,
          name: item.name,
          item_id: item.item_id || null,
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message || 'Failed to create item');
      }
      
      // Automatically create a default subject for this item
      await supabase
        .from('subjects')
        .insert({
          label: '', // Empty label indicates this is an implicit rating
          pos_label: 'Recommend',
          neg_label: 'Not Recommended',
          event_id: eventId,
          item_id: newItem.id,
          metadata: { is_default: true } // Mark this as the default subject
        });
      
      // Store the first created item ID for redirection
      if (result.successful === 0) {
        firstCreatedItemId = newItem.id;
      }
      
      result.successful++;
    } catch (error) {
      result.failed.push({
        row: i + 1, // 1-indexed for user readability
        item,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Revalidate the event page
  revalidatePath(`/dashboard/events/${eventId}`);
  if (event) {
    revalidatePath(`/${event.slug}`);
  }
  
  if (firstCreatedItemId) {
    result.redirectToItem = firstCreatedItemId;
  }
  
  return result;
} 