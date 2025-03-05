'use client';

import { LocationProvider } from '@/components/location/LocationContext';
import { Toaster } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';

interface EventLayoutProps {
  children: React.ReactNode;
  params: { 
    eventSlug: string;
  };
}

export default function EventLayout({ 
  children,
}: EventLayoutProps) {
  const searchParams = useSearchParams();
  const location = searchParams.get('location');
  
  return (
    <MainLayout>
      <LocationProvider initialLocationId={location}>
        <Toaster position="top-center" />
        {children}
      </LocationProvider>
    </MainLayout>
  );
} 