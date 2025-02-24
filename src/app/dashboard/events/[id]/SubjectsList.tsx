'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { createSubject, updateSubject, deleteSubject } from '@/lib/events/subject-actions';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';
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

type Subject = Database['public']['Tables']['subjects']['Row'];

interface SubjectsListProps {
  eventId: string;
  subjects: Subject[];
  itemId?: string;
}

export function SubjectsList({ eventId, subjects, itemId }: SubjectsListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [label, setLabel] = useState('');
  const [posLabel, setPosLabel] = useState('');
  const [negLabel, setNegLabel] = useState('');
  
  const resetForm = () => {
    setLabel('');
    setPosLabel('');
    setNegLabel('');
    setEditingSubject(null);
  };
  
  const handleOpenEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setLabel(subject.label);
    setPosLabel(subject.pos_label);
    setNegLabel(subject.neg_label);
  };
  
  const handleCloseDialog = () => {
    resetForm();
    setIsAddDialogOpen(false);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!label.trim() || !posLabel.trim() || !negLabel.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (editingSubject) {
        // Update existing subject
        await updateSubject(editingSubject.id, {
          label,
          pos_label: posLabel,
          neg_label: negLabel,
        });
        toast.success('Subject updated successfully');
      } else {
        // Create new subject
        await createSubject({
          event_id: eventId,
          label,
          pos_label: posLabel,
          neg_label: negLabel,
          item_id: itemId,
        });
        toast.success('Subject created successfully');
      }
      
      handleCloseDialog();
    } catch (error) {
      toast.error(editingSubject ? 'Error updating subject' : 'Error creating subject', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async (subjectId: string) => {
    try {
      await deleteSubject(subjectId);
      toast.success('Subject deleted successfully');
    } catch (error) {
      toast.error('Error deleting subject', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Voting Subjects</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>
                Create a new voting subject for this event.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Question/Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Is this product good?"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="posLabel">Positive Option</Label>
                <Input
                  id="posLabel"
                  placeholder="e.g., Yes"
                  value={posLabel}
                  onChange={(e) => setPosLabel(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="negLabel">Negative Option</Label>
                <Input
                  id="negLabel"
                  placeholder="e.g., No"
                  value={negLabel}
                  onChange={(e) => setNegLabel(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : (editingSubject ? 'Update Subject' : 'Add Subject')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Dialog - reuses the same form */}
        <Dialog open={!!editingSubject} onOpenChange={(open) => !open && setEditingSubject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subject</DialogTitle>
              <DialogDescription>
                Update this voting subject.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-label">Question/Label</Label>
                <Input
                  id="edit-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-posLabel">Positive Option</Label>
                <Input
                  id="edit-posLabel"
                  value={posLabel}
                  onChange={(e) => setPosLabel(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-negLabel">Negative Option</Label>
                <Input
                  id="edit-negLabel"
                  value={negLabel}
                  onChange={(e) => setNegLabel(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingSubject(null)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Update Subject'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {subjects.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <h4 className="text-lg font-medium mb-2">No subjects yet</h4>
          <p className="text-muted-foreground mb-4">
            Create your first voting subject to get started.
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {subjects.map((subject) => (
            <div key={subject.id} className="flex justify-between items-center p-4 border rounded-md">
              <div>
                <h4 className="font-medium">{subject.label}</h4>
                <div className="text-sm text-muted-foreground">
                  {subject.pos_label} / {subject.neg_label}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(subject)}>
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
                      <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this subject? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(subject.id)}>
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