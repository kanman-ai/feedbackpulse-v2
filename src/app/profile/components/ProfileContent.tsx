/**
 * Profile Content Component
 * 
 * Main content area for the profile page that displays user information,
 * editable settings, and user projects with role information.
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { UserInfoSection } from './UserInfoSection';
import { EditDisplayName } from './EditDisplayName';
import { PasswordChange } from './PasswordChange';
import { UserProjects } from './UserProjects';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Basic types for profile functionality
type Profile = {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string | null;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string | null;
};

type UserProject = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string | null;
  role: 'owner' | 'member';
};

/**
 * Profile content component that handles fetching and displaying user profile data.
 * Manages state for user profile information and associated projects.
 * 
 * @returns JSX element containing the complete profile interface
 */
export function ProfileContent() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches user profile data from the database
   */
  const fetchProfile = async () => {
    if (!user?.id) return;

    try {
      const supabaseAny = supabase as any;
      const { data, error } = await supabaseAny
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data as Profile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile information');
    }
  };

  /**
   * Fetches user projects and their role in each project
   */
  const fetchUserProjects = async () => {
    if (!user?.id) return;

    try {
      // Get projects where user is owner
      const supabaseAny = supabase as any;
      const { data: ownedProjects, error: ownedError } = await supabaseAny
        .from('projects')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Get projects where user is a member
      const { data: memberProjects, error: memberError } = await supabaseAny
        .from('project_members')
        .select('project_id, projects(*)')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Combine and format projects with roles
      const projects: UserProject[] = [
        ...(ownedProjects || []).map((project: any) => ({
          ...project,
          role: 'owner' as const
        })),
        ...(memberProjects || [])
          .filter((member: any) => member.projects) // Filter out null projects
          .map((member: any) => ({
            ...(member.projects),
            role: 'member' as const
          }))
      ];

      setUserProjects(projects);
    } catch (err) {
      console.error('Error fetching user projects:', err);
      setError('Failed to load projects');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchUserProjects()]);
      setLoading(false);
    };

    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Please log in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* User Information Section */}
      <UserInfoSection user={user} profile={profile} />

      {/* Profile Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Display Name */}
        <EditDisplayName 
          currentDisplayName={profile?.display_name || user.email || ''}
          onUpdate={fetchProfile}
        />

        {/* Password Change */}
        <PasswordChange />
      </div>

      {/* User Projects */}
      <UserProjects projects={userProjects} />
    </div>
  );
}