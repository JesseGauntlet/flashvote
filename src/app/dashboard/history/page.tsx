import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { requireSession, getCreatorStatus } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';
import { ExternalLink, ThumbsDown, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

// Define the structure based on the Supabase query response
export interface VoteHistoryItem {
  id: string;
  created_at: string;
  choice: boolean;
  subject: {
    label: string;
    pos_label: string;
    neg_label: string;
    event: {
      title: string;
      slug: string;
    };
    item: {
      name: string;
    } | null;
  };
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HistoryPage({ searchParams }: PageProps) {
  const session = await requireSession();
  const isCreator = await getCreatorStatus();
  const supabase = await createClient();
  
  // Access searchParams asynchronously
  const params = await searchParams;
  
  // Pagination parameters
  const pageSize = 10;
  // Safely access page parameter
  const pageParam = params.page;
  const currentPage = typeof pageParam === 'string' ? parseInt(pageParam, 10) : 1;
  const offset = (currentPage - 1) * pageSize;
  
  // Fetch the user's vote history with pagination
  const { data: voteHistory, error, count } = await supabase
    .from('votes')
    .select(
      `
      id,
      created_at,
      choice,
      subject:subject_id (
        label,
        pos_label,
        neg_label,
        event:event_id (
          title,
          slug
        ),
        item:item_id (
          name
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);
  
  // Calculate total pages
  const totalPages = count ? Math.ceil(count / pageSize) : 0;
  
  // Map voteHistory to cast to VoteHistoryItem[], properly handling nested arrays
  const typedVoteHistory = (voteHistory || []).map((vote) => {
    // Handle nested structures that might be arrays
    const subject = Array.isArray(vote.subject) ? vote.subject[0] : vote.subject;
    
    // Process nested event and item objects that might be arrays
    const processedSubject = {
      ...subject,
      event: Array.isArray(subject.event) ? subject.event[0] : subject.event,
      item: subject.item
        ? Array.isArray(subject.item)
          ? subject.item[0]
          : subject.item
        : null,
    };
    
    return {
      id: vote.id,
      created_at: vote.created_at,
      choice: vote.choice,
      subject: processedSubject,
    };
  }) as VoteHistoryItem[];
  
  return (
    <DashboardLayout isCreator={isCreator}>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Vote History</h1>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Votes</CardTitle>
              <CardDescription>
                A record of all your previous votes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-destructive">
                  Error loading vote history: {error.message}
                </p>
              )}
              
              {!error && typedVoteHistory.length === 0 && (
                <p className="text-muted-foreground">
                  You haven&apos;t cast any votes yet.
                </p>
              )}
              
              {!error && typedVoteHistory.length > 0 && (
                <div className="space-y-4">
                  {typedVoteHistory.map((vote) => (
                    <div key={vote.id} className="border rounded-md p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {vote.subject.label}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              {vote.choice ? (
                                <ThumbsUp className="h-3 w-3 mr-1" />
                              ) : (
                                <ThumbsDown className="h-3 w-3 mr-1" />
                              )}
                              {vote.choice
                                ? vote.subject.pos_label
                                : vote.subject.neg_label}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Event: {vote.subject.event.title}
                          </p>
                          {vote.subject.item && (
                            <p className="text-sm text-muted-foreground">
                              Item: {vote.subject.item.name}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Voted on{' '}
                            {format(new Date(vote.created_at), 'PPP p')}
                          </p>
                        </div>
                        <Link href={`/${vote.subject.event.slug}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Event
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination className="mt-6">
                      <PaginationContent>
                        {currentPage > 1 && (
                          <PaginationItem>
                            <PaginationPrevious
                              href={`/dashboard/history?page=${currentPage - 1}`}
                            />
                          </PaginationItem>
                        )}
                        
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            // Show pages around the current page
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  href={`/dashboard/history?page=${pageNum}`}
                                  isActive={pageNum === currentPage}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }
                        )}
                        
                        {currentPage < totalPages && (
                          <PaginationItem>
                            <PaginationNext
                              href={`/dashboard/history?page=${
                                currentPage + 1
                              }`}
                            />
                          </PaginationItem>
                        )}
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
