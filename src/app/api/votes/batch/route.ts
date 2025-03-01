import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const subjectIds = url.searchParams.get('subject_ids');
    
    if (!subjectIds) {
      return NextResponse.json({ message: 'subject_ids parameter is required' }, { status: 400 });
    }
    
    const subjectIdsArray = subjectIds.split(',');
    
    // Validate that we have at least one subject ID
    if (subjectIdsArray.length === 0) {
      return NextResponse.json({ message: 'At least one subject ID is required' }, { status: 400 });
    }
    
    // Optional locationId filter
    const locationId = url.searchParams.get('location_id');
    
    const supabase = await createClient();
    
    // Get all votes for the specified subjects in a single query
    let query = supabase
      .from('votes')
      .select('id, subject_id, choice')
      .in('subject_id', subjectIdsArray);
      
    // Add location filter if provided
    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching votes batch:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    
    // Process the data to get counts for each subject
    const results: Record<string, { positive: number; negative: number }> = {};
    
    // Initialize results for all requested subject IDs with zero counts
    subjectIdsArray.forEach(id => {
      results[id] = { positive: 0, negative: 0 };
    });
    
    // Count votes
    data?.forEach(vote => {
      if (vote.choice) {
        results[vote.subject_id].positive += 1;
      } else {
        results[vote.subject_id].negative += 1;
      }
    });
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error processing batch votes request:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 