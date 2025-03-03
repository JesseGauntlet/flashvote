'use client';

import { useState, useRef } from 'react';
import { Upload, AlertTriangle, CheckCircle2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useRouter } from 'next/navigation';

interface Event {
  id: string;
  title: string;
}

interface DetailedError {
  row: number;
  error: string;
  location: {
    name: string;
    [key: string]: string | null | number;
  };
}

export function BulkLocationUpload() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileContents, setFileContents] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailedErrors, setDetailedErrors] = useState<DetailedError[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [isErrorExpanded, setIsErrorExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear the state when the dialog is opened/closed
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      loadEvents();
    } else {
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedEventId(undefined);
    setFileName(null);
    setFileContents(null);
    setError(null);
    setDetailedErrors([]);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load events that the user has access to
  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Fetch events owned by the user
      const { data: ownedEvents, error: ownedEventsError } = await supabase
        .from('events')
        .select('id, title');
      
      if (ownedEventsError) throw ownedEventsError;
      
      // Fetch events where user is an admin with editor role
      const { data: adminEvents, error: adminEventsError } = await supabase
        .from('admins')
        .select('event_id, events:event_id(id, title)')
        .eq('role', 'editor');
      
      if (adminEventsError) throw adminEventsError;
      
      // Combine the events
      const combinedEvents: Event[] = [
        ...(ownedEvents || []),
        ...((adminEvents || [])
          .filter(admin => admin.events)
          .map(admin => {
            const event = admin.events as unknown as Event;
            return {
              id: event.id,
              title: event.title
            };
          }))
      ];
      
      // Remove duplicates (in case user is both owner and admin)
      const uniqueEvents = Array.from(
        new Map(combinedEvents.map(event => [event.id, event])).values()
      );
      
      setEvents(uniqueEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccess(null);
    setDetailedErrors([]);
    
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setFileContents(null);
      return;
    }
    
    setFileName(file.name);
    
    // Read the file contents
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContents(event.target?.result as string);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setFileContents(null);
    };
    reader.readAsText(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEventId) {
      setError('Please select an event');
      return;
    }
    
    if (!fileContents) {
      setError('Please upload a CSV file');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setDetailedErrors([]);
    
    try {
      // Send the data to the API
      const response = await fetch('/api/locations/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: selectedEventId,
          csvData: fileContents,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload locations');
      }
      
      if (result.failed && result.failed.length > 0) {
        // Some locations failed to upload
        setDetailedErrors(result.failed);
        setSuccess(`Successfully uploaded ${result.successful} location(s), with ${result.failed.length} error(s)`);
      } else {
        // All locations were uploaded successfully
        setSuccess(`Successfully uploaded ${result.successful} location(s)`);
        
        // Close the dialog after a short delay on complete success
        if (result.successful > 0 && (!result.failed || result.failed.length === 0)) {
          setTimeout(() => {
            setIsOpen(false);
            router.refresh(); // Refresh the page to show the new locations
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Error uploading locations:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload locations');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Locations</DialogTitle>
          <DialogDescription>
            Upload multiple locations at once using a CSV file.
            <br />
            Format: locationName,address,city,zip,lat,lon
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-select">Select Event</Label>
            <Select
              value={selectedEventId}
              onValueChange={setSelectedEventId}
              disabled={isLoading || isUploading}
            >
              <SelectTrigger id="event-select">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex justify-center p-2">
                    <Spinner />
                  </div>
                ) : events.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No events found
                  </div>
                ) : (
                  events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                id="csv-file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Choose File
              </Button>
              <span className="text-sm text-muted-foreground">
                {fileName || 'No file selected'}
              </span>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {detailedErrors.length > 0 && (
            <Collapsible
              open={isErrorExpanded}
              onOpenChange={setIsErrorExpanded}
              className="border rounded-md"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <h4 className="text-sm font-medium">Error Details</h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {isErrorExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="p-4">
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {detailedErrors.map((error, index) => (
                    <div key={index} className="text-sm border-b pb-2 last:border-0 last:pb-0">
                      <p>
                        <span className="font-medium">Row {error.row}:</span>{' '}
                        {error.error}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Location: {error.location.name}
                      </p>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedEventId || !fileContents || isUploading}>
              {isUploading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 