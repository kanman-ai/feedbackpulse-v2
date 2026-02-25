/**
 * User Profile Page
 * 
 * Displays user information, allows editing of display name, password changes,
 * and shows user projects with their roles (owner vs team member).
 */

import { Suspense } from 'react';
import { ProfileContent } from './components/ProfileContent';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

/**
 * Profile page component that renders the user's profile information and settings.
 * Requires authentication - redirects to login if user is not authenticated.
 * 
 * @returns JSX element containing the profile page layout
 */
export default function ProfilePage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account information, security settings, and view your projects.
          </p>
        </div>

        {/* Profile Content with Suspense for loading state */}
        <Suspense 
          fallback={
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          }
        >
          <ProfileContent />
        </Suspense>
      </div>
    </div>
  );
}