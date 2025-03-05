'use client';

import React from 'react';
import { MainLayout } from './MainLayout';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/events', label: 'Events' },
    { href: '/dashboard/history', label: 'History' },
    { href: '/dashboard/settings', label: 'Settings' },
  ];

  return (
    <MainLayout>
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        <aside className="space-y-6">
          <nav className="space-y-1">
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
        <main>{children}</main>
      </div>
    </MainLayout>
  );
} 