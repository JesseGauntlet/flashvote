'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Progress } from '@/components/ui/progress';

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
  const [posCount, setPosCount] = useState(0);
  const [negCount, setNegCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVotes = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        
        // Query for positive votes
        const { data: posData, error: posError } = await supabase
          .from('votes')
          .select('id')
          .eq('subject_id', subjectId)
          .eq('choice', true);
          
        if (posError) throw new Error(posError.message);
        
        // Query for negative votes
        const { data: negData, error: negError } = await supabase
          .from('votes')
          .select('id')
          .eq('subject_id', subjectId)
          .eq('choice', false);
          
        if (negError) throw new Error(negError.message);
        
        setPosCount(posData?.length || 0);
        setNegCount(negData?.length || 0);
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
    const channel = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `subject_id=eq.${subjectId}`,
        },
        () => {
          fetchVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subjectId, locationId]);

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