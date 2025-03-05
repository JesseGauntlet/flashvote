'use client'

import { updatePassword } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if we have a hash fragment which indicates we came from a password reset email
    const hash = window.location.hash
    if (hash && hash.startsWith('#access_token=')) {
      // We came from a reset password email link - the user already has a session
      console.log('Reset password token detected')
    }
  }, [])

  async function handleSubmit(formData: FormData) {
    try {
      setError('')
      setSuccess('')
      setLoading(true)

      // Validate password match
      const password = formData.get('password') as string
      const confirmPassword = formData.get('confirm-password') as string

      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      // For a reset password flow, we don't need to verify the old password
      // Pass a placeholder value for the current password and the new one for the new password
      const result = await updatePassword('', password)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        // Show success message and redirect after a short delay
        setSuccess('Password updated successfully! Redirecting to login...')
        setTimeout(() => {
          window.location.href = '/login?message=Password+updated+successfully'
        }, 2000)
      }
    } catch (e) {
      console.error('Error updating password:', e)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <form action={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-100 text-green-700 p-3 rounded-md text-sm">
                {success}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Updating password...' : 'Update password'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 