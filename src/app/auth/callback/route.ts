import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Get the request URL and base URL for redirects
  const requestUrl = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin
  
  // Get the code from the URL
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  
  // If there's a code, exchange it for a session
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    // Log errors but continue with redirect
    if (error) {
      console.error('Error exchanging code for session:', error.message)
    }
    
    // If this is a password reset flow, redirect to update password
    if (next.includes('reset-password')) {
      return NextResponse.redirect(`${baseUrl}/auth/reset-password/update`)
    }
  }
  
  // Redirect to wherever they need to go next
  // Use string concat instead of URL constructor to avoid relative URL issues
  return NextResponse.redirect(`${baseUrl}${next.startsWith('/') ? next : `/${next}`}`)
}