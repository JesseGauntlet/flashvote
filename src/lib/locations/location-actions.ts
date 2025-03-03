import { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Define the schema for a single location
const LocationSchema = z.object({
  name: z.string().min(1, { message: 'Location name is required' }),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  lat: z.string().optional().nullable().transform(val => val ? parseFloat(val) : null),
  lon: z.string().optional().nullable().transform(val => val ? parseFloat(val) : null),
});

export type LocationData = z.infer<typeof LocationSchema>;

interface BulkCreateLocationsOptions {
  eventId: string;
  locations: Record<string, string>[];
  supabase: SupabaseClient;
}

interface BulkCreateLocationsResult {
  success: number;
  errors: string[];
}

export async function bulkCreateLocations({
  eventId,
  locations,
  supabase
}: BulkCreateLocationsOptions): Promise<BulkCreateLocationsResult> {
  // Initialize result
  const result: BulkCreateLocationsResult = {
    success: 0,
    errors: [],
  };

  // Validate eventId
  if (!eventId) {
    throw new Error('Event ID is required');
  }

  // Check if the event exists
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    throw new Error(`Event with ID ${eventId} not found`);
  }

  // Get existing locations for this event to check for duplicates
  const { data: existingLocations } = await supabase
    .from('locations')
    .select('name, address, city, zip_code')
    .eq('event_id', eventId);

  // Process each location one by one
  for (let i = 0; i < locations.length; i++) {
    const row = locations[i];
    const rowIndex = i + 1; // For error messages (1-indexed)
    
    try {
      // Map CSV columns to our schema
      const locationData = {
        name: row.locationName || row.name || '',
        address: row.address || null,
        city: row.city || null,
        zip_code: row.zip || row.zip_code || null,
        lat: row.lat || null,
        lon: row.lon || null,
      };
      
      // Validate location data
      const validatedLocation = LocationSchema.parse(locationData);
      
      // Check for potential duplicates
      const isDuplicate = existingLocations?.some(loc => 
        loc.name.toLowerCase() === validatedLocation.name.toLowerCase() && 
        loc.address === validatedLocation.address &&
        loc.city === validatedLocation.city &&
        loc.zip_code === validatedLocation.zip_code
      );

      if (isDuplicate) {
        throw new Error(`Duplicate location found with name "${validatedLocation.name}"`);
      }

      // Insert the validated location
      const { error: insertError } = await supabase
        .from('locations')
        .insert({
          ...validatedLocation,
          event_id: eventId,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to insert location: ${insertError.message}`);
      }

      // Increment success count
      result.success++;
      
      // Add this location to existing locations to prevent duplicates within the batch
      existingLocations?.push({
        name: validatedLocation.name,
        address: validatedLocation.address,
        city: validatedLocation.city,
        zip_code: validatedLocation.zip_code
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const fieldError of error.errors) {
          result.errors.push(`Row ${rowIndex}: ${fieldError.message} (${row.locationName || row.name || 'Unnamed location'})`);
        }
      } else {
        result.errors.push(`Row ${rowIndex}: ${error instanceof Error ? error.message : 'Unknown error'} (${row.locationName || row.name || 'Unnamed location'})`);
      }
    }
  }

  return result;
} 