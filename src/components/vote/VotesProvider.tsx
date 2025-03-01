'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

type VoteResults = {
  positive: number;
  negative: number;
};

type VotesContextType = {
  voteResults: Record<string, VoteResults>;
  isLoading: boolean;
  error: string | null;
  refetchVotes: () => Promise<void>;
};

const VotesContext = createContext<VotesContextType | undefined>(undefined);

interface VotesProviderProps {
  subjectIds: string[];
  locationId?: string;
  children: React.ReactNode;
}

export function VotesProvider({ subjectIds, locationId, children }: VotesProviderProps) {
  const [voteResults, setVoteResults] = useState<Record<string, VoteResults>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVotes = useCallback(async () => {
    if (subjectIds.length === 0) {
      setVoteResults({});
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('subject_ids', subjectIds.join(','));
      if (locationId) {
        queryParams.set('location_id', locationId);
      }

      const response = await fetch(`/api/votes/batch?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch votes data');
      }
      
      const data = await response.json();
      setVoteResults(data.results);
    } catch (err) {
      console.error('Error fetching votes batch:', err);
      setError('Failed to load voting results');
    } finally {
      setIsLoading(false);
    }
  }, [subjectIds, locationId]);

  useEffect(() => {
    fetchVotes();
    
    // Set up real-time updates for votes table changes
    const supabase = createClient();
    const channel = supabase
      .channel('votes-changes-batch')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `subject_id=in.(${subjectIds.join(',')})`,
        },
        () => {
          fetchVotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVotes, subjectIds]);

  const value = {
    voteResults,
    isLoading,
    error,
    refetchVotes: fetchVotes
  };

  return (
    <VotesContext.Provider value={value}>
      {children}
    </VotesContext.Provider>
  );
}

export function useVotes() {
  const context = useContext(VotesContext);
  if (context === undefined) {
    throw new Error('useVotes must be used within a VotesProvider');
  }
  return context;
}

// Helper component that provides votes data for a specific subject
export function useSubjectVotes(subjectId: string) {
  const { voteResults, isLoading, error } = useVotes();
  
  const result = voteResults[subjectId] || { positive: 0, negative: 0 };
  const total = result.positive + result.negative;
  const posPercentage = total > 0 ? Math.round((result.positive / total) * 100) : 50;
  const negPercentage = total > 0 ? Math.round((result.negative / total) * 100) : 50;
  
  return {
    posCount: result.positive,
    negCount: result.negative,
    totalVotes: total,
    posPercentage,
    negPercentage,
    isLoading,
    error
  };
} 