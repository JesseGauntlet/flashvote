'use client';

import { AuthProvider } from '@/lib/auth/context';
import { User } from '@supabase/supabase-js';

export interface ProvidersProps {
  children: React.ReactNode;
  initialUser: User | null;
}

export function Providers({ children, initialUser }: ProvidersProps) {
  return (
    <AuthProvider initialUser={initialUser}>
      {children}
    </AuthProvider>
  );
} 