import { Database } from '@/types/supabase';

type Subject = Database['public']['Tables']['subjects']['Row'];

declare module '../../SubjectsList' {
  export interface SubjectsListProps {
    eventId: string;
    subjects: Subject[];
    itemId?: string;
  }
  
  export function SubjectsList(props: SubjectsListProps): JSX.Element;
} 