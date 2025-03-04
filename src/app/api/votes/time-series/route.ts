import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const subjectId = url.searchParams.get('subject_id');
    
    if (!subjectId) {
      return NextResponse.json({ message: 'subject_id parameter is required' }, { status: 400 });
    }
    
    // Optional locationId filter
    const locationId = url.searchParams.get('location_id');
    
    // Optional timeframe
    const days = parseInt(url.searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const supabase = await createClient();
    
    // Get votes for the specified subject with timestamps
    let query = supabase
      .from('votes')
      .select('id, subject_id, choice, created_at')
      .eq('subject_id', subjectId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });
      
    // Add location filter if provided
    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching votes time series:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    
    // Process the data into a time series format
    const timeSeriesData = data?.map(vote => ({
      timestamp: vote.created_at,
      value: vote.choice ? 1 : 0 // 1 for positive, 0 for negative
    })) || [];
    
    // Also create a running average (with a window of 5 votes)
    const windowSize = 5;
    const runningAverage = [];
    
    for (let i = 0; i < timeSeriesData.length; i++) {
      const startIdx = Math.max(0, i - windowSize + 1);
      const window = timeSeriesData.slice(startIdx, i + 1);
      const sum = window.reduce((acc, item) => acc + item.value, 0);
      const avg = sum / window.length;
      
      runningAverage.push({
        timestamp: timeSeriesData[i].timestamp,
        value: avg
      });
    }
    
    return NextResponse.json({ 
      timeSeriesData,
      runningAverage
    });
  } catch (error) {
    console.error('Error processing vote time series:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 