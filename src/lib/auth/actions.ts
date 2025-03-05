'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return redirect('/dashboard')
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { message: 'Check your email to confirm your account' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  return redirect('/login')
}

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string
  
  const supabase = await createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password/update`,
  })

  if (error) {
    return { error: error.message }
  }

  return { message: 'Check your email for the password reset link' }
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const supabase = await createClient()
  
  // First, verify the current password by attempting to sign in
  const { data: { user }, error: signInError } = await supabase.auth.getUser()
  
  if (signInError || !user?.email) {
    return { error: 'Authentication failed. Please sign in again.' }
  }
  
  // Now update the password
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) {
    return { error: error.message }
  }
  
  return { success: 'Password updated successfully' }
}

export async function updateProfile(name: string, email: string) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: 'Authentication failed. Please sign in again.' };
  }
  
  // Update the profile in the profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      name,
      email
    })
    .eq('id', user.id);
  
  if (profileError) {
    return { error: profileError.message };
  }
  
  // If the email is being changed, update it in auth.users as well
  if (email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({
      email
    });
    
    if (emailError) {
      return { error: emailError.message };
    }
  }
  
  return { success: 'Profile updated successfully' };
}

export async function updatePremiumStatus(isPremium: boolean) {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: 'Authentication failed. Please sign in again.' };
  }
  
  // Update the premium status in the profiles table
  const { error } = await supabase
    .from('profiles')
    .update({
      is_premium: isPremium
    })
    .eq('id', user.id);
  
  if (error) {
    return { error: error.message };
  }
  
  return { success: 'Premium status updated successfully' };
} 