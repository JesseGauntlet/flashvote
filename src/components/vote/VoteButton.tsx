'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useLocation } from '@/components/location/LocationContext';
import { useVotes } from './VotesProvider';

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
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
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
  size = 'default',
  onClick
}: VoteButtonProps) {
  // Use the context location as a fallback when the prop isn't provided
  const { selectedLocation } = useLocation();
  const effectiveLocationId = locationId || (selectedLocation?.id);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Try to get optimisticVote from context, but don't fail if not available
  let optimisticVote: ((subjectId: string, choice: boolean) => void) | undefined;
  try {
    const votesContext = useVotes();
    optimisticVote = votesContext.optimisticVote;
  } catch (error) {
    // VotesProvider not available, will proceed without optimistic updates
    console.debug('VotesProvider not available for optimistic updates');
  }

  const handleVote = async () => {
    setIsLoading(true);
    
    // Immediately update the UI optimistically if the function is available
    if (optimisticVote) {
      optimisticVote(subjectId, choice);
    }
    
    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject_id: subjectId,
          location_id: effectiveLocationId,
          choice,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit vote');
      }

      // Show feedback animation
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
      }, 500); // Flash for 500ms

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
      onClick={(e) => {
        if (onClick) onClick(e);
        if (!e.defaultPrevented) handleVote();
      }}
      disabled={disabled || isLoading}
      size={size}
      className={cn(
        size === 'sm' ? 'h-8 px-3' : 'flex-1',
        variant === 'positive' 
          ? 'bg-[#FF9800] hover:bg-[#FFC107]' 
          : 'bg-[#D32F2F] hover:bg-[#B71C1C]',
        showFeedback && variant === 'positive' ? 'animate-pulse-green' : '',
        showFeedback && variant === 'negative' ? 'animate-pulse-red' : '',
        'transition-all duration-300'
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {icon}
          {label && <span className={icon ? 'ml-2' : ''}>{label}</span>}
        </>
      )}
    </Button>
  );
} 