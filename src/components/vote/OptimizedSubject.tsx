'use client';

import React, { useState } from 'react';
import { VoteButton } from './VoteButton';
import { OptimizedVoteResults } from './OptimizedVoteResults';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface OptimizedSubjectProps {
  id: string;
  label: string;
  posLabel: string;
  negLabel: string;
  locationId?: string;
}

export function OptimizedSubject({ 
  id, 
  label, 
  posLabel, 
  negLabel, 
  locationId 
}: OptimizedSubjectProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [lastVote, setLastVote] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleVoteSuccess = (choice: boolean) => {
    setHasVoted(true);
    setLastVote(choice);
    
    // Show feedback animation on the container
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
    }, 500); // Flash for 500ms
  };

  // If there's no label, this is a default subject (implicit rating)
  // Use a more compact layout without the card wrapper
  if (!label) {
    return (
      <div className={`flex items-center justify-between transition-colors duration-300 rounded-md p-2 ${
        showFeedback && lastVote === true ? 'bg-green-100' : 
        showFeedback && lastVote === false ? 'bg-red-100' : ''
      }`}>
        <OptimizedVoteResults
          subjectId={id}
          posLabel={posLabel}
          negLabel={negLabel}
          simplified={true}
          ultraCompact={true}
        />
        
        {!hasVoted ? (
          <div className="flex gap-1">
            <VoteButton
              subjectId={id}
              locationId={locationId}
              choice={true}
              label=""
              variant="positive"
              onVoteSuccess={() => handleVoteSuccess(true)}
              icon={<ThumbsUp className="h-4 w-4" />}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
            />
            <VoteButton
              subjectId={id}
              locationId={locationId}
              choice={false}
              label=""
              variant="negative"
              onVoteSuccess={() => handleVoteSuccess(false)}
              icon={<ThumbsDown className="h-4 w-4" />}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
            />
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Thanks!
          </div>
        )}
      </div>
    );
  }

  // Regular subject with a label
  return (
    <Card className={`overflow-hidden mb-2 transition-colors duration-300 ${
      showFeedback && lastVote === true ? 'bg-green-50 border-green-200' : 
      showFeedback && lastVote === false ? 'bg-red-50 border-red-200' : ''
    }`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* Question */}
          <div className="font-medium text-sm">{label}</div>
          
          {/* Simplified vote results and buttons in a single row */}
          <div className="flex items-center gap-2">
            <OptimizedVoteResults
              subjectId={id}
              posLabel={posLabel}
              negLabel={negLabel}
              simplified={true}
              ultraCompact={true}
            />
            
            {!hasVoted ? (
              <div className="flex gap-1">
                <VoteButton
                  subjectId={id}
                  locationId={locationId}
                  choice={true}
                  label=""
                  variant="positive"
                  onVoteSuccess={() => handleVoteSuccess(true)}
                  icon={<ThumbsUp className="h-4 w-4" />}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                />
                <VoteButton
                  subjectId={id}
                  locationId={locationId}
                  choice={false}
                  label=""
                  variant="negative"
                  onVoteSuccess={() => handleVoteSuccess(false)}
                  icon={<ThumbsDown className="h-4 w-4" />}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                />
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Thanks!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 