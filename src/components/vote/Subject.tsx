'use client';

import React, { useState } from 'react';
import { VoteButton } from './VoteButton';
import { VoteResults } from './VoteResults';
import { Card, CardContent } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface SubjectProps {
  id: string;
  label: string;
  posLabel: string;
  negLabel: string;
  locationId?: string;
}

export function Subject({ id, label, posLabel, negLabel, locationId }: SubjectProps) {
  const [hasVoted, setHasVoted] = useState(false);

  const handleVoteSuccess = () => {
    setHasVoted(true);
  };

  return (
    <Card className="overflow-hidden mb-2">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          {/* Question */}
          <div className="font-medium text-sm">{label}</div>
          
          {/* Simplified vote results and buttons in a single row */}
          <div className="flex items-center gap-2">
            <VoteResults
              subjectId={id}
              locationId={locationId}
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
                  onVoteSuccess={handleVoteSuccess}
                  icon={<ThumbsUp className="h-3 w-3" />}
                  size="sm"
                />
                <VoteButton
                  subjectId={id}
                  locationId={locationId}
                  choice={false}
                  label=""
                  variant="negative"
                  onVoteSuccess={handleVoteSuccess}
                  icon={<ThumbsDown className="h-3 w-3" />}
                  size="sm"
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