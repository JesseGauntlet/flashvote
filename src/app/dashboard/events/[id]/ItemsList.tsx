'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Pencil, Trash2, Upload, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { createItem, updateItem, deleteItem, bulkCreateItems, CsvItemData } from '@/lib/events/item-actions';
import { parseCSV } from '@/lib/utils';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Item = Database['public']['Tables']['items']['Row'];

interface ItemsListProps {
  eventId: string;
  items: Item[];
}

export function ItemsList({ eventId, items }: ItemsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvItemData[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<{
    successful: number;
    failed: { row: number; item: CsvItemData; error: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [itemSlug, setItemSlug] = useState('');
  const [itemId, setItemId] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const resetForm = () => {
    setName('');
    setItemSlug('');
    setItemId('');
    setCategory('');
    setImageUrl('');
    setEditingItem(null);
  };
  
  const handleOpenEditDialog = (item: Item) => {
    setEditingItem(item);
    setName(item.name);
    setItemSlug(item.item_slug);
    setItemId(item.item_id || '');
    setCategory(item.category || '');
    setImageUrl(item.image_url || '');
  };
  
  const handleCloseDialog = () => {
    resetForm();
    setIsAddDialogOpen(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !itemSlug.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editingItem) {
        // Update existing item
        await updateItem(editingItem.id, {
          name,
          item_slug: itemSlug,
          item_id: itemId || undefined,
          category: category || undefined,
          image_url: imageUrl || undefined,
        });
        toast.success('Item updated successfully');
      } else {
        // Create new item
        await createItem({
          event_id: eventId,
          name,
          item_slug: itemSlug,
          item_id: itemId || undefined,
          category: category || undefined,
          image_url: imageUrl || undefined,
        });
        toast.success('Item created successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      toast.error(editingItem ? 'Error updating item' : 'Error creating item', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem(itemId);
      toast.success('Item deleted successfully');
    } catch (error) {
      toast.error('Error deleting item', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Auto-generate slug from name if slug is empty
    if (!itemSlug) {
      setItemSlug(
        newName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };
  
  const resetBulkUploadForm = () => {
    setCsvFile(null);
    setCsvPreview([]);
    setCsvErrors([]);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleCloseBulkUploadDialog = () => {
    resetBulkUploadForm();
    setBulkUploadDialogOpen(false);
  };
  
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setCsvErrors([]);
    setCsvPreview([]);
    
    if (!file) {
      setCsvFile(null);
      return;
    }
    
    setCsvFile(file);
    
    // Read and parse the CSV file
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const { data, errors } = parseCSV(content, ['item_slug', 'name']);
      
      if (errors.length > 0) {
        setCsvErrors(errors);
        return;
      }
      
      // Convert to CsvItemData
      const parsedItems: CsvItemData[] = data.map(row => ({
        item_slug: row.item_slug,
        name: row.name,
        item_id: row.item_id
      }));
      
      setCsvPreview(parsedItems);
    };
    
    reader.readAsText(file);
  };
  
  const handleBulkUpload = async () => {
    if (!csvFile || csvPreview.length === 0) {
      toast.error('Please select a valid CSV file');
      return;
    }
    
    if (csvErrors.length > 0) {
      toast.error('Please fix CSV errors before uploading');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const result = await bulkCreateItems(eventId, csvPreview);
      setUploadResult(result);
      
      if (result.successful > 0) {
        toast.success(`Successfully imported ${result.successful} items`);
        
        // If there were no errors and we have an item to redirect to
        if (result.failed.length === 0 && result.redirectToItem) {
          handleCloseBulkUploadDialog();
          router.push(`/dashboard/events/${eventId}/items/${result.redirectToItem}`);
        }
      } else {
        toast.error('Failed to import any items');
      }
    } catch (error) {
      toast.error('Error importing items', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.item_slug.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Items</h3>
        <div className="flex gap-2">
          <Dialog open={isBulkUploadDialogOpen} onOpenChange={setBulkUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetBulkUploadForm}>
                <Upload className="mr-2 h-4 w-4" />
                Add Multiple
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk Import Items</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to add multiple items at once. The CSV must include columns for &apos;item_slug&apos; and &apos;name&apos;.
                </DialogDescription>
              </DialogHeader>
              
              {!uploadResult ? (
                <>
                  <div className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="csv-file">CSV File</Label>
                      <Input
                        ref={fileInputRef}
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                        disabled={isUploading}
                      />
                      <p className="text-sm text-muted-foreground">
                        Example format: item_slug,name,item_id
                      </p>
                    </div>
                    
                    {csvErrors.length > 0 && (
                      <div className="bg-destructive/10 p-3 rounded-md border border-destructive">
                        <h4 className="text-sm font-medium flex items-center text-destructive mb-1">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          CSV Validation Errors
                        </h4>
                        <ul className="text-sm text-destructive space-y-1 list-disc list-inside">
                          {csvErrors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {csvPreview.length > 0 && (
                      <div className="border rounded-md p-3">
                        <h4 className="text-sm font-medium mb-2">Preview ({csvPreview.length} items)</h4>
                        <div className="max-h-[200px] overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="border-b">
                              <tr>
                                <th className="text-left py-2 px-1">Item Slug</th>
                                <th className="text-left py-2 px-1">Name</th>
                                <th className="text-left py-2 px-1">Item ID</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvPreview.slice(0, 10).map((item, i) => (
                                <tr key={i} className="border-b">
                                  <td className="py-2 px-1">{item.item_slug}</td>
                                  <td className="py-2 px-1">{item.name}</td>
                                  <td className="py-2 px-1">{item.item_id || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {csvPreview.length > 10 && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Showing 10 of {csvPreview.length} items
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseBulkUploadDialog} disabled={isUploading}>
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleBulkUpload} 
                      disabled={isUploading || csvPreview.length === 0 || csvErrors.length > 0}
                    >
                      {isUploading ? 'Uploading...' : 'Upload and Import'}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h3 className="text-base font-medium">Import Summary</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-md border border-green-200">
                      <p className="text-lg font-bold text-green-700">{uploadResult.successful}</p>
                      <p className="text-sm text-green-700">Items successfully imported</p>
                    </div>
                    
                    <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                      <p className="text-lg font-bold text-amber-700">{uploadResult.failed.length}</p>
                      <p className="text-sm text-amber-700">Items failed to import</p>
                    </div>
                  </div>
                  
                  {uploadResult.failed.length > 0 && (
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="failures">
                        <AccordionTrigger className="text-sm font-medium">
                          View Failed Items
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="max-h-[200px] overflow-y-auto border rounded-md">
                            <table className="w-full text-sm">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="text-left py-2 px-3">Row</th>
                                  <th className="text-left py-2 px-3">Item Slug</th>
                                  <th className="text-left py-2 px-3">Name</th>
                                  <th className="text-left py-2 px-3">Error</th>
                                </tr>
                              </thead>
                              <tbody>
                                {uploadResult.failed.map((failure, i) => (
                                  <tr key={i} className="border-t">
                                    <td className="py-2 px-3">{failure.row}</td>
                                    <td className="py-2 px-3">{failure.item.item_slug}</td>
                                    <td className="py-2 px-3">{failure.item.name}</td>
                                    <td className="py-2 px-3 text-destructive">{failure.error}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                  
                  <DialogFooter>
                    <Button type="button" onClick={handleCloseBulkUploadDialog}>
                      Close
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Create a new item for this event.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Blueberries"
                    value={name}
                    onChange={handleNameChange}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="itemSlug">Item Slug</Label>
                  <Input
                    id="itemSlug"
                    placeholder="e.g., blueberries"
                    value={itemSlug}
                    onChange={(e) => setItemSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-muted-foreground">
                    This will be used in the URL: flashvote.com/event-slug/item-slug
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="itemId">Item ID (Optional)</Label>
                  <Input
                    id="itemId"
                    placeholder="External system ID"
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Produce"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : (editingItem ? 'Update Item' : 'Add Item')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Dialog - reuses the same form */}
          <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Item</DialogTitle>
                <DialogDescription>
                  Update this item.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Item Name</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={handleNameChange}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-itemSlug">Item Slug</Label>
                  <Input
                    id="edit-itemSlug"
                    value={itemSlug}
                    onChange={(e) => setItemSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-muted-foreground">
                    Changing the slug will break existing links to this item.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-itemId">Item ID (Optional)</Label>
                  <Input
                    id="edit-itemId"
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category (Optional)</Label>
                  <Input
                    id="edit-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="edit-imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingItem(null)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Update Item'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Add search input */}
      {items.length > 0 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="Search items..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
      
      {items.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <h4 className="text-lg font-medium mb-2">No items yet</h4>
          <p className="text-muted-foreground mb-4">
            Create your first item to get started.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <h4 className="text-lg font-medium mb-2">No matching items</h4>
          <p className="text-muted-foreground mb-4">
            Try a different search term.
          </p>
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="flex justify-between items-center p-4 border rounded-md">
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <div className="text-sm text-muted-foreground">
                  /{item.item_slug}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/events/${eventId}/items/${item.id}`}>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </Link>
                
                <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Item</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this item? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(item.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 