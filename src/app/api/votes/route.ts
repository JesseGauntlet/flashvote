import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting
// In production, use a distributed cache like Redis
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const ipVoteTimestamps: Record<string, Record<string, number>> = {};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    const body = await request.json();
    
    const { subject_id, location_id, choice } = body;
    
    if (!subject_id) {
      return NextResponse.json({ message: 'Subject ID is required' }, { status: 400 });
    }
    
    if (typeof choice !== 'boolean') {
      return NextResponse.json({ message: 'Choice must be a boolean' }, { status: 400 });
    }
    
    // Check rate limiting
    const now = Date.now();
    if (!ipVoteTimestamps[ip]) {
      ipVoteTimestamps[ip] = {};
    }
    
    const lastVoteTime = ipVoteTimestamps[ip][subject_id] || 0;
    const timeSinceLastVote = now - lastVoteTime;
    
    if (timeSinceLastVote < RATE_LIMIT_WINDOW) {
      const secondsToWait = Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastVote) / 1000);
      return NextResponse.json(
        { message: `Rate limit exceeded. Please wait ${secondsToWait} seconds before voting again.` },
        { status: 429 }
      );
    }
    
    // Get user ID if authenticated
    const { data: { session } } = await supabase.auth.getSession();
    const user_id = session?.user?.id;
    
    // Insert vote
    const { data, error } = await supabase
      .from('votes')
      .insert({
        subject_id,
        location_id: location_id || null,
        user_id: user_id || null,
        user_ip: ip,
        choice,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting vote:', error);
      return NextResponse.json({ message: error.message }, { status: 500 });
    }
    
    // Update rate limit timestamp
    ipVoteTimestamps[ip][subject_id] = now;
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 