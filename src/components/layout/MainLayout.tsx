'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/hooks';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Toaster } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col overflow-y-scroll">
      <Toaster position="top-center" />
      
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            HotDogHot
          </Link>
          <nav className="flex items-center gap-4 h-10">
            {loading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            ) : (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link href="/dashboard">
                      <Button variant="ghost">Dashboard</Button>
                    </Link>
                    <form action="/api/auth/signout" method="post">
                      <Button variant="outline" type="submit">
                        Sign Out
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Link href="/login">
                      <Button variant="ghost">Login</Button>
                    </Link>
                    <Link href="/signup">
                      <Button>Sign Up</Button>
                    </Link>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} HotDogHot. All rights reserved.
        </div>
      </footer>
    </div>
  );
} 