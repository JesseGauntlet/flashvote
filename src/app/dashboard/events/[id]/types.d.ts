import { Database } from '@/types/supabase';

type Event = Database['public']['Tables']['events']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];
type Item = Database['public']['Tables']['items']['Row'];

declare module './EventDetailsForm' {
  export interface EventDetailsFormProps {
    event: Event;
  }
  
  export function EventDetailsForm(props: EventDetailsFormProps): JSX.Element;
}

declare module './SubjectsList' {
  export interface SubjectsListProps {
    eventId: string;
    subjects: Subject[];
    itemId?: string;
  }
  
  export function SubjectsList(props: SubjectsListProps): JSX.Element;
}

declare module './ItemsList' {
  export interface ItemsListProps {
    eventId: string;
    items: Item[];
  }
  
  export function ItemsList(props: ItemsListProps): JSX.Element;
} 