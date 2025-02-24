export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          owner_id: string
          slug: string
          title: string
          is_premium: boolean
          archived_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          slug: string
          title: string
          is_premium?: boolean
          archived_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          slug?: string
          title?: string
          is_premium?: boolean
          archived_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          event_id: string
          item_slug: string
          name: string
          item_id: string | null
          image_url: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          item_slug: string
          name: string
          item_id?: string | null
          image_url?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          item_slug?: string
          name?: string
          item_id?: string | null
          image_url?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          event_id: string
          item_id: string | null
          label: string
          pos_label: string
          neg_label: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          item_id?: string | null
          label: string
          pos_label: string
          neg_label: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          item_id?: string | null
          label?: string
          pos_label?: string
          neg_label?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          subject_id: string
          user_id: string | null
          user_ip: string | null
          lat: number | null
          lon: number | null
          choice: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          subject_id: string
          user_id?: string | null
          user_ip?: string | null
          lat?: number | null
          lon?: number | null
          choice: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string
          user_id?: string | null
          user_ip?: string | null
          lat?: number | null
          lon?: number | null
          choice?: boolean
          metadata?: Json | null
          created_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          event_id: string
          user_id: string
          role: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          role: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          role?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          is_premium: boolean
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          is_premium?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_premium?: boolean
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 