'use client';

import { Progress } from '@/components/ui/progress';
import { useSubjectVotes } from './VotesProvider';

export interface OptimizedVoteResultsProps {
  subjectId: string;
  posLabel: string;
  negLabel: string;
  simplified?: boolean;
  ultraCompact?: boolean;
}

export function OptimizedVoteResults({
  subjectId,
  posLabel,
  negLabel,
  simplified = false,
  ultraCompact = false
}: OptimizedVoteResultsProps) {
  const {
    posCount,
    negCount,
    totalVotes,
    posPercentage,
    negPercentage,
    isLoading,
    error
  } = useSubjectVotes(subjectId);

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