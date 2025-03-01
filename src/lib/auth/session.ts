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