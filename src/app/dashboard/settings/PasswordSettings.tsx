'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updatePassword } from '@/lib/auth/actions';

export function PasswordSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await updatePassword(currentPassword, newPassword);
      
      if (result.error) {
        toast.error('Failed to update password', {
          description: result.error,
        });
        return;
      }
      
      // Clear the form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">Current Password</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">
          Password must be at least 8 characters long.
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
} 