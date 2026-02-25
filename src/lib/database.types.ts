/**
 * TypeScript type definitions for FeedbackPulse v2 database schema.
 * 
 * This file contains all database table types, view types, function types,
 * and enum types used throughout the application. These types are generated
 * from the Supabase schema and ensure type safety for all database operations.
 * 
 * @module DatabaseTypes
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
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          website_url: string | null
          is_active: boolean
          widget_customization: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          website_url?: string | null
          is_active?: boolean
          widget_customization?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          website_url?: string | null
          is_active?: boolean
          widget_customization?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          id: string
          project_id: string
          rating: number
          comment: string | null
          email: string | null
          source_url: string | null
          source_type: string | null
          sentiment: string | null
          user_agent: string | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          rating: number
          comment?: string | null
          email?: string | null
          source_url?: string | null
          source_type?: string | null
          sentiment?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          rating?: number
          comment?: string | null
          email?: string | null
          source_url?: string | null
          source_type?: string | null
          sentiment?: string | null
          user_agent?: string | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback_analytics: {
        Row: {
          id: string
          project_id: string
          date: string
          total_submissions: number
          avg_rating: number | null
          rating_distribution: Json | null
          sentiment_distribution: Json | null
          source_breakdown: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          date: string
          total_submissions?: number
          avg_rating?: number | null
          rating_distribution?: Json | null
          sentiment_distribution?: Json | null
          source_breakdown?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          date?: string
          total_submissions?: number
          avg_rating?: number | null
          rating_distribution?: Json | null
          sentiment_distribution?: Json | null
          source_breakdown?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_analytics_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      project_stats: {
        Row: {
          project_id: string | null
          total_feedback: number | null
          avg_rating: number | null
          latest_feedback: string | null
          sentiment_breakdown: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      calculate_sentiment: {
        Args: {
          feedback_text: string
        }
        Returns: string
      }
      aggregate_daily_analytics: {
        Args: {
          target_project_id: string
          target_date: string
        }
        Returns: undefined
      }
      get_project_analytics: {
        Args: {
          project_id: string
          start_date?: string
          end_date?: string
        }
        Returns: {
          date: string
          total_submissions: number
          avg_rating: number
          rating_distribution: Json
          sentiment_distribution: Json
          source_breakdown: Json
        }[]
      }
    }
    Enums: {
      sentiment_type: "positive" | "neutral" | "negative"
      source_type: "widget" | "email" | "manual" | "api"
    }
  }
}

/**
 * Type aliases for commonly used database types
 */

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Commonly used table types
export type Profile = Tables<'profiles'>
export type Project = Tables<'projects'>
export type Feedback = Tables<'feedback'>
export type FeedbackAnalytics = Tables<'feedback_analytics'>
export type ProjectStats = Database['public']['Views']['project_stats']['Row']

// Insert types for forms
export type ProfileInsert = Inserts<'profiles'>
export type ProjectInsert = Inserts<'projects'>
export type FeedbackInsert = Inserts<'feedback'>

// Update types for editing
export type ProfileUpdate = Updates<'profiles'>
export type ProjectUpdate = Updates<'projects'>
export type FeedbackUpdate = Updates<'feedback'>

// Enum types
export type SentimentType = Enums<'sentiment_type'>
export type SourceType = Enums<'source_type'>

/**
 * Widget customization settings type
 */
export interface WidgetCustomization {
  /** Primary color for the widget button and form elements */
  primaryColor: string
  /** Button text displayed on the floating button */
  buttonText: string
  /** Position of the floating button on the page */
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Form title shown at the top of the feedback form */
  formTitle: string
  /** Placeholder text for the comment field */
  commentPlaceholder: string
  /** Whether to show the email field in the form */
  showEmailField: boolean
  /** Custom thank you message after submission */
  thankYouMessage: string
  /** Whether to show the widget on the page (can be hidden) */
  isVisible: boolean
}

/**
 * Analytics data aggregation types
 */
export interface AnalyticsData {
  date: string
  totalSubmissions: number
  averageRating: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  sentimentDistribution: {
    positive: number
    neutral: number
    negative: number
  }
  sourceBreakdown: {
    widget: number
    email: number
    manual: number
    api: number
  }
}

/**
 * Feedback with related data for display
 */
export interface FeedbackWithProject extends Feedback {
  project: Pick<Project, 'id' | 'name'>
}

/**
 * Project with aggregated statistics
 */
export interface ProjectWithStats extends Project {
  stats: ProjectStats
}