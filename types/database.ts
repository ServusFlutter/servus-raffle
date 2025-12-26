/**
 * Supabase Database Types
 *
 * This file is auto-generated. Do not edit directly.
 * Run `bun run supabase:types` to regenerate after schema changes.
 *
 * Until Supabase is running, we provide placeholder types matching our schema.
 */

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
      profiles: {
        Row: {
          id: string
          name: string | null
          meetup_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          meetup_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          meetup_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      raffles: {
        Row: {
          id: string
          name: string
          status: 'draft' | 'active' | 'drawing' | 'completed'
          qr_code: string | null
          qr_code_expires_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          status?: 'draft' | 'active' | 'drawing' | 'completed'
          qr_code?: string | null
          qr_code_expires_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          status?: 'draft' | 'active' | 'drawing' | 'completed'
          qr_code?: string | null
          qr_code_expires_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'raffles_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      participants: {
        Row: {
          id: string
          raffle_id: string
          user_id: string
          ticket_count: number
          joined_at: string
        }
        Insert: {
          id?: string
          raffle_id: string
          user_id: string
          ticket_count?: number
          joined_at?: string
        }
        Update: {
          id?: string
          raffle_id?: string
          user_id?: string
          ticket_count?: number
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'participants_raffle_id_fkey'
            columns: ['raffle_id']
            isOneToOne: false
            referencedRelation: 'raffles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'participants_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      prizes: {
        Row: {
          id: string
          raffle_id: string
          name: string
          description: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          raffle_id: string
          name: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          raffle_id?: string
          name?: string
          description?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'prizes_raffle_id_fkey'
            columns: ['raffle_id']
            isOneToOne: false
            referencedRelation: 'raffles'
            referencedColumns: ['id']
          }
        ]
      }
      winners: {
        Row: {
          id: string
          raffle_id: string
          prize_id: string
          user_id: string
          tickets_at_win: number
          won_at: string
        }
        Insert: {
          id?: string
          raffle_id: string
          prize_id: string
          user_id: string
          tickets_at_win: number
          won_at?: string
        }
        Update: {
          id?: string
          raffle_id?: string
          prize_id?: string
          user_id?: string
          tickets_at_win?: number
          won_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'winners_raffle_id_fkey'
            columns: ['raffle_id']
            isOneToOne: false
            referencedRelation: 'raffles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'winners_prize_id_fkey'
            columns: ['prize_id']
            isOneToOne: false
            referencedRelation: 'prizes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'winners_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Raffle = Database['public']['Tables']['raffles']['Row']
export type Participant = Database['public']['Tables']['participants']['Row']
export type Prize = Database['public']['Tables']['prizes']['Row']
export type Winner = Database['public']['Tables']['winners']['Row']

export type RaffleStatus = Raffle['status']
