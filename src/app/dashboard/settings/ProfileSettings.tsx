'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { updateProfile } from '@/lib/auth/actions';

interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  is_premium: boolean;
  creator: boolean;
}

interface ProfileSettingsProps {
  user: User;
  profile: Profile;
}

export function ProfileSettings({ user, profile }: ProfileSettingsProps) {
  const [name, setName] = useState(profile.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalName, setOriginalName] = useState(profile.name || '');
  
  const handleCancel = () => {
    setName(originalName);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const result = await updateProfile(name, user.email || '');
      
      if (result.error) {
        toast.error('Failed to update profile', {
          description: result.error,
        });
        return;
      }
      
      toast.success('Profile updated successfully');
      setOriginalName(name); // Update the original name after successful save
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={user.email || ''}
          disabled
          className="bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Your email address is used for login and notifications.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Your name will be displayed on your profile and in communications.
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || name === originalName}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button 
          type="button" 
          onClick={handleCancel} 
          variant="outline" 
          disabled={isSubmitting || name === originalName}
        >
          Cancel
        </Button>
      </div>
      
      <div className="pt-4 text-sm text-muted-foreground">
        <p>
          Created: {new Date(user.created_at || '').toLocaleDateString()}
        </p>
      </div>
    </form>
  );
} 