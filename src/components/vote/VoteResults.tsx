'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Progress } from '@/components/ui/progress';
import { useLocation } from '@/components/location/LocationContext';
import { useVotes, useSubjectVotes } from './VotesProvider';

export interface VoteResultsProps {
  subjectId: string;
  locationId?: string;
  posLabel: string;
  negLabel: string;
  simplified?: boolean;
  ultraCompact?: boolean;
}

export function VoteResults({
  subjectId,
  locationId,
  posLabel,
  negLabel,
  simplified = false,
  ultraCompact = false
}: VoteResultsProps) {
  // Use the context location as a fallback when the prop isn't provided
  const { selectedLocation } = useLocation();
  const effectiveLocationId = locationId || (selectedLocation?.id);
  
  // Try to get votes from context first (for optimistic updates)
  const votesContext = useVotes();
  
  // Use the useSubjectVotes hook to get vote data
  let subjectVotes;
  try {
    subjectVotes = useSubjectVotes(subjectId);
  } catch (e) {
    // If the hook fails (not in a VotesProvider context), we'll fall back to direct fetching
    subjectVotes = null;
  }
  
  const [posCount, setPosCount] = useState(subjectVotes?.posCount || 0);
  const [negCount, setNegCount] = useState(subjectVotes?.negCount || 0);
  const [isLoading, setIsLoading] = useState(!subjectVotes);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have subject votes from context, use those values
    if (subjectVotes) {
      setPosCount(subjectVotes.posCount);
      setNegCount(subjectVotes.negCount);
      setIsLoading(false);
    }
  }, [subjectVotes]);

  useEffect(() => {
    // Skip fetching if we're using votes from context
    if (subjectVotes) return;
    
    const fetchVotes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        
        // Query builder for positive votes
        let posQuery = supabase
          .from('votes')
          .select('id')
          .eq('subject_id', subjectId)
          .eq('choice', true);
          
        // Add location filter if provided
        if (effectiveLocationId) {
          posQuery = posQuery.eq('location_id', effectiveLocationId);
        }
        
        // Execute positive votes query
        const { data: posData, error: posError } = await posQuery;
        
        if (posError) throw new Error(posError.message);
        
        // Query builder for negative votes
        let negQuery = supabase
          .from('votes')
          .select('id')
          .eq('subject_id', subjectId)
          .eq('choice', false);
          
        // Add location filter if provided
        if (effectiveLocationId) {
          negQuery = negQuery.eq('location_id', effectiveLocationId);
        }
        
        // Execute negative votes query
        const { data: negData, error: negError } = await negQuery;
          
        if (negError) throw new Error(negError.message);
        
        setPosCount(posData?.length || 0);
        setNegCount(negData?.length || 0);
        
        // If we have a votes context, try to update it with the fetched data
        if (votesContext) {
          // We can't directly update the context, but we can use it for future optimistic updates
        }
      } catch (err) {
        console.error('Error fetching votes:', err);
        setError('Failed to load voting results');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotes();
    
    // Set up real-time subscription for votes
    const supabase = createClient();
    
    // Build filter for real-time subscription
    let filter = `subject_id=eq.${subjectId}`;
    if (effectiveLocationId) {
      filter += ` AND location_id=eq.${effectiveLocationId}`;
    }
    
    const channel = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: filter,
        },
        () => {
          fetchVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subjectId, effectiveLocationId, votesContext, subjectVotes]);

  const totalVotes = posCount + negCount;
  const posPercentage = totalVotes > 0 ? Math.round((posCount / totalVotes) * 100) : 50;
  const negPercentage = totalVotes > 0 ? Math.round((negCount / totalVotes) * 100) : 50;

  if (isLoading) {
    return <div className="text-center text-sm text-muted-foreground">Loading results...</div>;
  }

  if (error) {
    return <div className="text-center text-sm text-red-500">{error}</div>;
  }

  if (ultraCompact) {
    return (
      <div className="text-sm font-medium">
        {posPercentage}% <span className="text-xs text-muted-foreground">({totalVotes})</span>
      </div>
    );
  }

  if (simplified) {
    return (
      <div className="flex items-center gap-2">
        <Progress value={posPercentage} className="h-2 w-24" />
        <span className="text-sm font-medium">{posPercentage}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{posLabel}</span>
        <span>{posCount} votes ({posPercentage}%)</span>
      </div>
      <Progress value={posPercentage} className="h-2" />
      
      <div className="flex justify-between text-sm mt-4">
        <span>{negLabel}</span>
        <span>{negCount} votes ({negPercentage}%)</span>
      </div>
      <Progress value={negPercentage} className="h-2" />
      
      <div className="text-center text-xs text-muted-foreground mt-2">
        Total votes: {totalVotes}
      </div>
    </div>
  );
} 