'use client';

import React, { useState } from 'react';
import { VoteButton } from './VoteButton';
import { VoteResults } from './VoteResults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <VoteResults
          subjectId={id}
          locationId={locationId}
          posLabel={posLabel}
          negLabel={negLabel}
        />

        {!hasVoted && (
          <div className="flex justify-between gap-4 mt-4">
            <VoteButton
              subjectId={id}
              locationId={locationId}
              choice={true}
              label={posLabel}
              variant="positive"
              onVoteSuccess={handleVoteSuccess}
            />
            <VoteButton
              subjectId={id}
              locationId={locationId}
              choice={false}
              label={negLabel}
              variant="negative"
              onVoteSuccess={handleVoteSuccess}
            />
          </div>
        )}

        {hasVoted && (
          <div className="text-center text-sm text-muted-foreground">
            Thank you for voting!
          </div>
        )}
      </CardContent>
    </Card>
  );
}