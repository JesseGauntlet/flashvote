import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { requireSession, getCreatorStatus } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileSettings } from './ProfileSettings';
import { PasswordSettings } from './PasswordSettings';
import { PremiumSettings } from './PremiumSettings';

export default async function SettingsPage() {
  const session = await requireSession();
  const isCreator = await getCreatorStatus();
  const supabase = await createClient();
  
  // Fetch the user's profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (error) {
    console.error('Error fetching profile:', error);
  }
  
  return (
    <DashboardLayout isCreator={isCreator}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                View and manage your profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileSettings 
                user={session.user} 
                profile={profile || { id: session.user.id, name: '', email: '', is_premium: false }}
              />
            </CardContent>
          </Card>
          
          {/* Password Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Change your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PasswordSettings />
            </CardContent>
          </Card>
          
          {/* Premium Status */}
          <Card>
            <CardHeader>
              <CardTitle>Premium Status</CardTitle>
              <CardDescription>
                Manage your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PremiumSettings isPremium={profile?.is_premium || false} />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 