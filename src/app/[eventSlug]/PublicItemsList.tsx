'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
// import { Subject } from '@/components/vote/Subject';
import { OptimizedSubject } from '@/components/vote/OptimizedSubject';
import { VotesProvider } from '@/components/vote/VotesProvider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Export the interface so it's considered used by TypeScript
export interface Item {
  id: string;
  name: string;
  item_slug: string;
  category?: string;
}

interface SubjectData {
  id: string;
  label: string;
  pos_label: string;
  neg_label: string;
  locationId?: string;
}

interface PublicItemsListProps {
  items: Item[];
  eventSlug: string;
  itemSubjectsByItemId: Record<string, { 
    defaultSubject?: SubjectData, 
    regularSubjects: SubjectData[] 
  }>;
  locationId?: string | null;
}

export function PublicItemsList({ 
  items, 
  eventSlug, 
  itemSubjectsByItemId,
  locationId 
}: PublicItemsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Get unique categories from items
  const uniqueCategories = ['All', ...new Set(items
    .map(item => item.category)
    .filter(Boolean) as string[])];
  
  // Memoize the subject IDs array so it maintains referential equality
  const allSubjectIds = useMemo(() => {
    const ids: string[] = [];
    
    // Gather all subject IDs from all items 
    Object.values(itemSubjectsByItemId).forEach(({ defaultSubject, regularSubjects }) => {
      if (defaultSubject) {
        ids.push(defaultSubject.id);
      }
      regularSubjects.forEach(subject => {
        ids.push(subject.id);
      });
    });
    
    return ids;
  }, [itemSubjectsByItemId]); // Only recompute if itemSubjectsByItemId changes

  // Filter items based on search query and active category
  const filteredItems = items.filter((item) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(query) && 
          !item.item_slug.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    // Category filter
    if (activeCategory !== 'All') {
      return item.category === activeCategory;
    }
    
    return true;
  });

  // Wrap the entire component with VotesProvider to fetch ALL votes once
  return (
    <VotesProvider subjectIds={allSubjectIds} locationId={locationId || undefined}>
      <div className="space-y-6">
        {/* Category tabs - only show if there are items with categories */}
        {items.length > 0 && uniqueCategories.length > 1 && (
          <Tabs defaultValue="All" value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="mb-4 flex flex-wrap h-auto">
              {uniqueCategories.map((category) => (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="mb-1"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
        
        {/* Search input - only show if there are items */}
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
        
        {/* No items message */}
        {items.length === 0 && (
          <div className="text-center p-8 border rounded-md">
            <h3 className="text-lg font-medium mb-2">No items available</h3>
            <p className="text-muted-foreground">
              There are no items to display for this event.
            </p>
          </div>
        )}
        
        {/* No matches message */}
        {items.length > 0 && filteredItems.length === 0 && (
          <div className="text-center p-8 border rounded-md">
            <h3 className="text-lg font-medium mb-2">No matching items</h3>
            <p className="text-muted-foreground mb-4">
              Try a different search term.
            </p>
            <button 
              className="text-primary underline"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </button>
          </div>
        )}
        
        {/* Items list */}
        {filteredItems.length > 0 && (
          <div className="space-y-6">
            {filteredItems.map((item) => {
              const { defaultSubject } = itemSubjectsByItemId[item.id] || 
                { defaultSubject: undefined, regularSubjects: [] };
              
              return (
                <div 
                  key={item.id} 
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4 bg-muted/30">
                    <div className="flex justify-between items-center mb-2">
                      <Link 
                        href={`/${eventSlug}/${item.item_slug}${locationId ? `?location=${locationId}` : ''}`}
                        className="text-lg font-semibold hover:underline flex items-center gap-1"
                      >
                        {item.name}
                        <ArrowRight className="h-4 w-4 opacity-50" />
                      </Link>
                    </div>
                    
                    {/* Default subject (implicit rating) */}
                    {defaultSubject && (
                      <div className="p-1">
                        <OptimizedSubject
                          key={defaultSubject.id}
                          id={defaultSubject.id}
                          label=""
                          posLabel={defaultSubject.pos_label}
                          negLabel={defaultSubject.neg_label}
                          locationId={locationId || undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </VotesProvider>
  );
} 