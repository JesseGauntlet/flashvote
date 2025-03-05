import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getSession() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    
    if (!user) return null
    
    // Create a session-like object with the user
    return {
      user,
      // Add any other session properties you need
    }
  } catch {
    return null
  }
}

export async function requireSession() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }
  return session
}

export async function getUser() {
  const session = await getSession()
  return session?.user ?? null
}

export async function requireUser() {
  const session = await requireSession()
  return session.user
}

export async function requireCreator() {
  const session = await requireSession();
  const supabase = await createClient();
  
  // Fetch the user's profile to check creator status
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('creator')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    redirect('/dashboard/settings');
  }
  
  // Redirect if not a creator
  if (!profile?.creator) {
    redirect('/dashboard/settings');
  }
  
  return session;
}

export async function getCreatorStatus() {
  const session = await requireSession();
  const supabase = await createClient();
  
  // Fetch the user's profile to check creator status
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('creator')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return false;
  }
  
  return profile?.creator || false;
} 