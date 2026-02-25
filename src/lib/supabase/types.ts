/**
 * TypeScript database types for FeedbackPulse v2 Supabase integration.
 * Generated from the database schema contract and provides type safety
 * for all database operations.
 */

/**
 * Main database interface defining all table schemas and relationships.
 * Used by Supabase client for type-safe queries and mutations.
 */
export interface Database {
  public: {
    Tables: {
      /**
       * User profiles table extending Supabase auth.users
       * Stores additional user metadata and preferences
       */
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      /**
       * Organizations table for multi-tenant support
       */
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      /**
       * Organization memberships for user-org relationships
       */
      organization_members: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
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
      user_role: 'admin' | 'user'
      member_role: 'owner' | 'admin' | 'member'
    }
  }
}

/**
 * User profile data structure for type safety in components
 */
export type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * Organization data structure for type safety in components  
 */
export type Organization = Database['public']['Tables']['organizations']['Row']

/**
 * Organization membership data structure for type safety in components
 */
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']