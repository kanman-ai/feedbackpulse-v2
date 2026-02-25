/**
 * Database query utilities for FeedbackPulse v2.
 */

import { supabase } from './supabase'
import type { Project, Feedback, Profile } from './database.types'

// Profile operations
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

// Project operations
export async function getUserProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

// Feedback operations
export async function getProjectFeedback(projectId: string) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}