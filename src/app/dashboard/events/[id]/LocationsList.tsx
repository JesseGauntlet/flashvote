'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Upload, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import BulkLocationUpload from './BulkLocationUpload';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export type LocationWithEvent = {
  id: string;
  name: string;
  event_id: string;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  lat: number | null;
  lon: number | null;
  created_at: string;
  events?: { id: string; title: string } | null;
};

interface LocationsListProps {
  eventId: string;
  locations: LocationWithEvent[];
}

export default function LocationsList({ eventId, locations = [] }: LocationsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [locationsList, setLocationsList] = useState<LocationWithEvent[]>(locations);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<LocationWithEvent | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Filter locations based on search query
  const filteredLocations = locationsList.filter((location) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      location.name?.toLowerCase().includes(query) ||
      location.city?.toLowerCase().includes(query) ||
      location.address?.toLowerCase().includes(query) ||
      location.zip_code?.toLowerCase().includes(query)
    );
  });

  // Refresh locations from the database
  const refreshLocations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('event_id', eventId)
        .order('name');

      if (error) {
        console.error('Error fetching locations:', error);
        toast.error('Failed to refresh locations');
        return;
      }

      setLocationsList(data || []);
    } catch (error) {
      console.error('Error in refreshLocations:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful bulk upload
  const handleBulkUploadSuccess = () => {
    refreshLocations();
    setShowBulkUpload(false);
  };

  // Delete location
  const deleteLocation = async () => {
    if (!locationToDelete) return;
    
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationToDelete.id);

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Location "${locationToDelete.name}" deleted successfully`);
      setLocationToDelete(null);
      refreshLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search locations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setShowBulkUpload(true)}
          >
            <Upload className="h-4 w-4" />
            <span>Bulk Upload</span>
          </Button>
          <Link href={`/dashboard/events/${eventId}/locations/new`}>
            <Button size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Location</span>
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery.trim() 
            ? 'No locations match your search. Try a different query.' 
            : 'No locations found for this event. Add some using the button above.'}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>City</TableHead>
                <TableHead>ZIP</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell>{location.address || '-'}</TableCell>
                  <TableCell>{location.city || '-'}</TableCell>
                  <TableCell>{location.zip_code || '-'}</TableCell>
                  <TableCell>
                    {location.lat && location.lon
                      ? `${location.lat.toFixed(6)}, ${location.lon.toFixed(6)}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/events/${eventId}/locations/${location.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setLocationToDelete(location)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Bulk Upload Dialog */}
      <BulkLocationUpload 
        eventId={eventId}
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onSuccess={handleBulkUploadSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!locationToDelete} onOpenChange={(open) => !open && setLocationToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{locationToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteLocation} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 