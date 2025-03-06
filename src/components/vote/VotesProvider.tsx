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
  optimisticVote: (subjectId: string, choice: boolean) => void;
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
      // Use POST endpoint instead of GET to handle large numbers of subject IDs
      const response = await fetch('/api/votes/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject_ids: subjectIds,
          location_id: locationId,
        }),
      });
      
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
    
    // Build filter for real-time subscription
    let filter = `subject_id=in.(${subjectIds.join(',')})`;
    if (locationId) {
      filter += ` AND location_id=eq.${locationId}`;
    }
    
    const channel = supabase
      .channel('votes-changes-batch')
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
  }, [fetchVotes, subjectIds, locationId]);

  // Function to optimistically update vote counts
  const optimisticVote = useCallback((subjectId: string, choice: boolean) => {
    setVoteResults(prevResults => {
      // Get current results for this subject or initialize if not exists
      const currentResult = prevResults[subjectId] || { positive: 0, negative: 0 };
      
      // Create a new result object with the updated count
      const newResult = {
        positive: choice ? currentResult.positive + 1 : currentResult.positive,
        negative: !choice ? currentResult.negative + 1 : currentResult.negative
      };
      
      // Return updated results
      return {
        ...prevResults,
        [subjectId]: newResult
      };
    });
  }, []);

  const value = {
    voteResults,
    isLoading,
    error,
    refetchVotes: fetchVotes,
    optimisticVote
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

// A simplified provider for a single subject
interface SingleSubjectVotesProviderProps {
  subjectId: string;
  locationId?: string;
  children: React.ReactNode;
}

export function SingleSubjectVotesProvider({ 
  subjectId, 
  locationId, 
  children 
}: SingleSubjectVotesProviderProps) {
  return (
    <VotesProvider 
      subjectIds={[subjectId]} 
      locationId={locationId}
    >
      {children}
    </VotesProvider>
  );
}

// New safe hook to call useSubjectVotes without throwing if provider is missing
export function useSafeSubjectVotes(subjectId: string) {
  try {
    return useSubjectVotes(subjectId);
  } catch {
    return null;
  }
} 