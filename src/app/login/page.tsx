'use client'

import { signIn } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [error, setError] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Check if there's a message in the URL (e.g., after password reset)
    const urlMessage = searchParams.get('message')
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage))
    }
  }, [searchParams])

  async function handleSubmit(formData: FormData) {
    try {
      setError('')
      setMessage('')
      setLoading(true)
      
      // Call the signIn function - this will redirect on success
      // or return an error object if authentication fails
      const result = await signIn(formData)
      
      // If we get here, it means there was an error with the login
      // and no redirect happened
      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    } catch (e) {
      // We should only reach this catch block for unexpected errors
      // not for the redirect which is expected behavior
      
      // Check if this is a redirect, which we can safely ignore
      // because redirects throw a NEXT_REDIRECT type of error
      const error = e as Error
      if (error.message && (
        error.message.includes('NEXT_REDIRECT') || 
        error.message.includes('Navigation') ||
        error.message.includes('redirect')
      )) {
        // This is an expected redirect, not an error
        // Don't set any error state
        return
      }
      
      // This is an actual unexpected error
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-100 text-green-700 p-3 rounded-md text-sm">
                {message}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <div className="text-sm text-right">
              <Link
                href="/auth/reset-password"
                className="text-primary hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 