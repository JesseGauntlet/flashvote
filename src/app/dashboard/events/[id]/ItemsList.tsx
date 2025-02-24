'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { createItem, updateItem, deleteItem } from '@/lib/events/item-actions';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';
import Link from 'next/link';
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

type Item = Database['public']['Tables']['items']['Row'];

interface ItemsListProps {
  eventId: string;
  items: Item[];
}

export function ItemsList({ eventId, items }: ItemsListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [itemSlug, setItemSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const resetForm = () => {
    setName('');
    setItemSlug('');
    setImageUrl('');
    setEditingItem(null);
  };
  
  const handleOpenEditDialog = (item: Item) => {
    setEditingItem(item);
    setName(item.name);
    setItemSlug(item.item_slug);
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
          image_url: imageUrl || undefined,
        });
        toast.success('Item updated successfully');
      } else {
        // Create new item
        await createItem({
          event_id: eventId,
          name,
          item_slug: itemSlug,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Items</h3>
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
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
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