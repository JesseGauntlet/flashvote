import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const zipCode = url.searchParams.get('zip_code');
    const eventId = url.searchParams.get('event_id');
    
    if (!zipCode) {
      return NextResponse.json({ message: 'Zip code is required for search' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Base query for locations
    let query = supabase
      .from('locations')
      .select('id, name, address, city, zip_code, lat, lon')
      .ilike('zip_code', `${zipCode}%`) // Search for zip codes starting with the provided value
      .order('name');
    
    // Add event_id filter if provided
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    
    // Execute query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error searching locations:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ locations: data || [] });
  } catch (error) {
    console.error('Error processing locations search:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 