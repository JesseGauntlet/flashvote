'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface VoteButtonProps {
  subjectId: string;
  locationId?: string;
  choice: boolean;
  label: string;
  variant: 'positive' | 'negative';
  disabled?: boolean;
  onVoteSuccess?: () => void;
  icon?: React.ReactNode;
  size?: 'default' | 'sm' | 'lg';
}

export function VoteButton({
  subjectId,
  locationId,
  choice,
  label,
  variant,
  disabled = false,
  onVoteSuccess,
  icon,
  size = 'default'
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
        throw new Error(error.message || 'Failed to submit vote');
      }

      if (onVoteSuccess) {
        onVoteSuccess();
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleVote}
      disabled={disabled || isLoading}
      size={size}
      className={cn(
        size === 'sm' ? 'h-6 px-2' : 'flex-1',
        variant === 'positive' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <>
          {icon}
          {label && <span className={icon ? 'ml-2' : ''}>{label}</span>}
        </>
      )}
    </Button>
  );
} 