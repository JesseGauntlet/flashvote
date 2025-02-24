'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoteButtonProps {
  subjectId: string;
  locationId?: string;
  choice: boolean;
  label: string;
  variant?: 'positive' | 'negative' | 'neutral';
  disabled?: boolean;
  onVoteSuccess?: () => void;
}

export function VoteButton({
  subjectId,
  locationId,
  choice,
  label,
  variant = 'neutral',
  disabled = false,
  onVoteSuccess,
}: VoteButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject_id: subjectId,
          location_id: locationId,
          choice,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cast vote');
      }

      toast.success('Vote cast successfully', {
        description: 'Your vote has been recorded.',
      });

      if (onVoteSuccess) {
        onVoteSuccess();
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Failed to cast vote',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleVote}
      disabled={disabled || isLoading}
      className={cn(
        'min-w-[100px] transition-all',
        variant === 'positive' && 'bg-green-600 hover:bg-green-700',
        variant === 'negative' && 'bg-red-600 hover:bg-red-700'
      )}
    >
      {isLoading ? 'Voting...' : label}
    </Button>
  );
} 