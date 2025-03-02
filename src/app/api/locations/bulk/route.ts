import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bulkCreateLocations } from '@/lib/locations/location-actions';
import { parseCSV } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { eventId, csv } = await req.json();
    
    if (!eventId || !csv) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId and csv' },
        { status: 400 }
      );
    }

    // Verify event exists and user has access
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: 'Event not found or access denied' },
        { status: 404 }
      );
    }

    // Parse the CSV data
    const parsedData = parseCSV(csv);
    
    if (!parsedData.data || parsedData.data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty CSV data' },
        { status: 400 }
      );
    }

    // Process the CSV data and create locations
    const result = await bulkCreateLocations({
      eventId,
      locations: parsedData.data,
      supabase,
    });

    // Revalidate the locations page and event page
    revalidatePath(`/dashboard/events/${eventId}`);
    revalidatePath('/dashboard/locations');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in bulk location upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 