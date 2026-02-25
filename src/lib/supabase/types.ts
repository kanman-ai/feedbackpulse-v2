/**
 * TypeScript type definitions for Supabase database schema.
 * Auto-generated types for type-safe database operations.
 */

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
          user_id: string
          public_token: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
          public_token?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
          public_token?: string | null
        }
      }
      feedback_responses: {
        Row: {
          id: string
          project_id: string
          rating: number
          feedback_text: string | null
          email: string | null
          helpful_votes: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          rating: number
          feedback_text?: string | null
          email?: string | null
          helpful_votes?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          rating?: number
          feedback_text?: string | null
          email?: string | null
          helpful_votes?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
  }
}

/**
 * Convenience types for working with specific tables
 */
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type FeedbackResponse = Database['public']['Tables']['feedback_responses']['Row']
export type FeedbackResponseInsert = Database['public']['Tables']['feedback_responses']['Insert']
export type FeedbackResponseUpdate = Database['public']['Tables']['feedback_responses']['Update']