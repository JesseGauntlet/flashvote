'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';
import { Progress } from '@/components/ui/progress';

interface VoteResultsProps {
  subjectId: string;
  locationId?: string;
  posLabel: string;
  negLabel: string;
}

type VoteCount = {
  positive: number;
  negative: number;
  total: number;
  positivePercentage: number;
  negativePercentage: number;
};

export function VoteResults({
  subjectId,
  locationId,
  posLabel,
  negLabel,
}: VoteResultsProps) {
  const [voteCounts, setVoteCounts] = useState<VoteCount>({
    positive: 0,
    negative: 0,
    total: 0,
    positivePercentage: 0,
    negativePercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch of vote counts
    const fetchVoteCounts = async () => {
      try {
        let query = supabase
          .from('votes')
          .select('choice', { count: 'exact' })
          .eq('subject_id', subjectId);

        if (locationId) {
          query = query.eq('location_id', locationId);
        }

        const { data, error } = await query;

        if (error) {
          throw new Error(error.message);
        }

        if (!data) {
          setVoteCounts({
            positive: 0,
            negative: 0,
            total: 0,
            positivePercentage: 0,
            negativePercentage: 0,
          });
          return;
        }

        const positive = data.filter((vote) => vote.choice).length;
        const negative = data.filter((vote) => !vote.choice).length;
        const total = positive + negative;

        setVoteCounts({
          positive,
          negative,
          total,
          positivePercentage: total > 0 ? (positive / total) * 100 : 0,
          negativePercentage: total > 0 ? (negative / total) * 100 : 0,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vote counts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoteCounts();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`votes:subject_id=eq.${subjectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: locationId 
            ? `subject_id=eq.${subjectId}&location_id=eq.${locationId}`
            : `subject_id=eq.${subjectId}`,
        },
        () => {
          fetchVoteCounts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [subjectId, locationId]);

  if (isLoading) {
    return <div className="animate-pulse h-20 bg-muted rounded-md"></div>;
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">{posLabel}</div>
        <div className="text-sm font-medium">{negLabel}</div>
      </div>
      
      <div className="relative h-8">
        <Progress 
          value={voteCounts.positivePercentage} 
          className="h-8 bg-red-200"
        />
        <div className="absolute inset-0 flex justify-between items-center px-3">
          <span className="text-xs font-medium text-primary-foreground">
            {voteCounts.positivePercentage.toFixed(1)}% ({voteCounts.positive})
          </span>
          <span className="text-xs font-medium">
            {voteCounts.negativePercentage.toFixed(1)}% ({voteCounts.negative})
          </span>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground text-center">
        Total votes: {voteCounts.total}
      </div>
    </div>
  );
} 