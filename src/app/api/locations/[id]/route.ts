import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const locationId = resolvedParams.id;
    
    if (!locationId) {
      return NextResponse.json({ message: 'Location ID is required' }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Fetch location details
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, address, city, zip_code, lat, lon')
      .eq('id', locationId)
      .single();
    
    if (error) {
      console.error('Error fetching location:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error processing location request:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 