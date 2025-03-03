'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, Check, X, ChevronDown, ChevronUp, AlertTriangle, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { parseCSV } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

interface BulkLocationUploadProps {
  eventId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

interface LocationPreview {
  name: string;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  lat: string | null;
  lon: string | null;
  isValid: boolean;
  errors: string[];
}

export default function BulkLocationUpload({ 
  eventId, 
  open, 
  onOpenChange, 
  onSuccess 
}: BulkLocationUploadProps) {
  const [fileContents, setFileContents] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResults, setUploadResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [isErrorsOpen, setIsErrorsOpen] = useState(false);
  const [previewData, setPreviewData] = useState<LocationPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFileContents('');
    setError(null);
    setUploadResults(null);
    setPreviewData([]);
    setShowPreview(false);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate a single location
  const validateLocation = (location: Record<string, string>): LocationPreview => {
    const errors: string[] = [];
    const name = location.locationName || location.name || '';
    
    if (!name) {
      errors.push('Location name is required');
    }
    
    // Optional validation for lat/lon if provided
    const lat = location.lat || null;
    const lon = location.lon || null;
    
    if (lat && isNaN(parseFloat(lat))) {
      errors.push('Latitude must be a valid number');
    }
    
    if (lon && isNaN(parseFloat(lon))) {
      errors.push('Longitude must be a valid number');
    }
    
    return {
      name,
      address: location.address || null,
      city: location.city || null,
      zip_code: location.zip || location.zip_code || null,
      lat,
      lon,
      isValid: errors.length === 0,
      errors
    };
  };

  // Process CSV data for preview
  const processCSVForPreview = (csvContent: string) => {
    try {
      const parsedData = parseCSV(csvContent);
      
      if (!parsedData.data || parsedData.data.length === 0) {
        setValidationErrors(['CSV file is empty or has invalid format']);
        setPreviewData([]);
        return false;
      }
      
      // Check for required headers
      const firstRow = parsedData.data[0];
      const hasNameColumn = 'locationName' in firstRow || 'name' in firstRow;
      
      if (!hasNameColumn) {
        setValidationErrors(['CSV must have a "locationName" or "name" column']);
        return false;
      }
      
      // Validate each row
      const validatedLocations = parsedData.data.map((row) => 
        validateLocation(row)
      );
      
      // Collect all validation errors
      const allErrors = validatedLocations
        .filter(loc => !loc.isValid)
        .map((loc, index) => 
          `Row ${index + 1} (${loc.name || 'Unnamed location'}): ${loc.errors.join(', ')}`
        );
      
      setPreviewData(validatedLocations);
      setValidationErrors(allErrors);
      
      return validatedLocations.some(loc => loc.isValid);
    } catch (err) {
      console.error('Error processing CSV:', err);
      setValidationErrors([err instanceof Error ? err.message : 'Failed to process CSV file']);
      return false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setUploadResults(null);
    setPreviewData([]);
    setValidationErrors([]);

    // Read file contents
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContents(content);
      
      // Process for preview
      if (content) {
        processCSVForPreview(content);
        setShowPreview(true);
      }
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileContents) {
      setError('Please select a CSV file');
      return;
    }

    // Check if there are any valid locations to upload
    const hasValidLocations = previewData.some(loc => loc.isValid);
    if (!hasValidLocations) {
      setError('No valid locations found in the CSV file');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setUploadResults(null);

      const response = await fetch('/api/locations/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          csv: fileContents,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload locations');
      }

      setUploadResults({
        success: result.success,
        errors: result.errors || [],
      });

      if (result.errors && result.errors.length > 0) {
        toast.warning(`Uploaded ${result.success} locations with ${result.errors.length} errors`);
      } else {
        toast.success(`Successfully uploaded ${result.success} locations`);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Error uploading locations:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during upload');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      if (onOpenChange) onOpenChange(false);
      // Reset form after animation completes
      setTimeout(resetForm, 300);
    }
  };

  const handleSuccess = () => {
    handleClose();
    if (onSuccess) onSuccess();
  };

  // Calculate success percentage for the progress bar
  const getSuccessPercentage = () => {
    if (!uploadResults) return 0;
    const total = uploadResults.success + uploadResults.errors.length;
    return total > 0 ? (uploadResults.success / total) * 100 : 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Locations</DialogTitle>
          <DialogDescription>
            Upload multiple locations at once using a CSV file. 
            The file should be formatted as: locationName,address,city,zip,lat,lon
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isLoading || !!uploadResults}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              CSV format: locationName,address,city,zip,lat,lon
            </p>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Validation Errors</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Please fix the following issues before uploading:</p>
                <Collapsible
                  open={isErrorsOpen}
                  onOpenChange={setIsErrorsOpen}
                  className="space-y-2"
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      {isErrorsOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span>
                        {isErrorsOpen ? 'Hide Details' : 'Show Details'}
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2">
                    <div className="rounded border p-2 bg-white max-h-40 overflow-y-auto text-sm">
                      <ul className="list-disc pl-4 space-y-1">
                        {validationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </AlertDescription>
            </Alert>
          )}

          {/* CSV Preview */}
          {showPreview && previewData.length > 0 && !uploadResults && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Preview ({previewData.length} locations)</h3>
              <div className="border rounded-md overflow-x-auto max-h-60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30px]">Status</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>ZIP</TableHead>
                      <TableHead>Coordinates</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.slice(0, 10).map((location, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {location.isValid ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{location.name || '-'}</TableCell>
                        <TableCell>{location.address || '-'}</TableCell>
                        <TableCell>{location.city || '-'}</TableCell>
                        <TableCell>{location.zip_code || '-'}</TableCell>
                        <TableCell>
                          {location.lat && location.lon
                            ? `${location.lat}, ${location.lon}`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewData.length > 10 && (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Showing 10 of {previewData.length} locations
                  </div>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {previewData.filter(loc => loc.isValid).length} valid locations
                </span>
                <span className="text-muted-foreground">
                  {previewData.filter(loc => !loc.isValid).length} invalid locations
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {uploadResults && (
            <div className="space-y-4">
              <Alert className={uploadResults.errors.length > 0 ? 'bg-yellow-50' : 'bg-green-50'}>
                <div className="flex gap-2">
                  {uploadResults.errors.length > 0 ? (
                    <InfoIcon className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                  <div>
                    <AlertTitle>
                      {uploadResults.errors.length > 0
                        ? 'Upload Completed with Warnings'
                        : 'Upload Successful'}
                    </AlertTitle>
                    <AlertDescription>
                      <p>{`Successfully uploaded ${uploadResults.success} locations.`}</p>
                      {uploadResults.errors.length > 0 && (
                        <p className="mt-1">{`${uploadResults.errors.length} locations failed to upload.`}</p>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>

              {/* Upload results summary */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-md border">
                <h3 className="text-sm font-medium">Upload Results</h3>
                
                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Success rate: {Math.round(getSuccessPercentage())}%</span>
                    <span>
                      {uploadResults.success} of {uploadResults.success + uploadResults.errors.length} locations
                    </span>
                  </div>
                  <Progress value={getSuccessPercentage()} className="h-2" />
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                    <span>Success: {uploadResults.success}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                    <span>Failed: {uploadResults.errors.length}</span>
                  </div>
                </div>

                {/* Errors detail */}
                {uploadResults.errors.length > 0 && (
                  <Collapsible
                    open={isErrorsOpen}
                    onOpenChange={setIsErrorsOpen}
                    className="mt-2 space-y-2"
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="flex items-center gap-1 w-full justify-between">
                        <span>Error Details</span>
                        {isErrorsOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2">
                      <div className="rounded border p-2 bg-white max-h-40 overflow-y-auto text-sm">
                        <ul className="list-disc pl-4 space-y-1">
                          {uploadResults.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-x-2 sm:space-y-0">
            {uploadResults ? (
              <Button type="button" onClick={handleSuccess}>
                Done
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!fileContents || isLoading || validationErrors.length > 0 || previewData.filter(loc => loc.isValid).length === 0}
                >
                  {isLoading ? 'Uploading...' : 'Upload'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 