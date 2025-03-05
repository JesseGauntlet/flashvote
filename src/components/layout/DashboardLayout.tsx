'use client';

import React from 'react';
import { MainLayout } from './MainLayout';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  isCreator: boolean;
}

export function DashboardLayout({ children, isCreator }: DashboardLayoutProps) {
  const pathname = usePathname();

  // Define navigation items based on creator status
  const getNavItems = () => {
    const baseItems = [
      { href: '/dashboard/history', label: 'History' },
      { href: '/dashboard/settings', label: 'Settings' },
    ];

    // Only add Overview and Events if the user is a creator
    if (isCreator) {
      return [
        { href: '/dashboard', label: 'Overview' },
        { href: '/dashboard/events', label: 'Events' },
        ...baseItems
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8 min-h-[calc(100vh-200px)]">
        <aside className="space-y-6">
          <nav className="space-y-1 sticky top-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="pb-8">{children}</main>
      </div>
    </MainLayout>
  );
} 