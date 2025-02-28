'use client';

import { Button } from '@/components/ui/button';

interface PremiumSettingsProps {
  isPremium: boolean;
}

export function PremiumSettings({ isPremium }: PremiumSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Current Plan</h3>
          <p className="text-sm text-muted-foreground">
            {isPremium ? 'Premium' : 'Free'}
          </p>
        </div>
        <div className="text-sm">
          {isPremium ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          ) : (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
              Free Tier
            </span>
          )}
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        {isPremium ? (
          <p>
            You are currently on the Premium plan. This gives you access to all features including
            unlimited events, custom domains, and advanced analytics.
          </p>
        ) : (
          <p>
            You are currently on the Free plan. Upgrade to Premium to unlock additional features
            including unlimited events, custom domains, and advanced analytics.
          </p>
        )}
      </div>
      
      {!isPremium && (
        <Button disabled className="mt-4">
          Upgrade to Premium (Coming Soon)
        </Button>
      )}
      
      {isPremium && (
        <Button variant="outline" disabled className="mt-4">
          Manage Subscription (Coming Soon)
        </Button>
      )}
    </div>
  );
} 