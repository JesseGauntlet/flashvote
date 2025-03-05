'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useAuth as useAuthContext } from './context'

export type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  is_premium: boolean;
  creator: boolean;
}

// Re-export the useAuth hook from context
export const useAuth = useAuthContext;

export function useProfile() {
  const { user, loading: userLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          setError(error.message);
        } else {
          setProfile(data as Profile);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred fetching profile');
      } finally {
        setLoading(false);
      }
    }

    if (!userLoading) {
      fetchProfile();
    }
  }, [user, userLoading, supabase]);

  return {
    profile,
    loading: userLoading || loading,
    error,
    isCreator: profile?.creator || false,
  };
} 