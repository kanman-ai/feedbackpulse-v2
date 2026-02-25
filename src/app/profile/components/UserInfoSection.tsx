/**
 * User Information Section Component
 * 
 * Displays basic user information including email, display name, and account status.
 */

import type { User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  display_name: string | null;
  created_at: string;
  updated_at: string | null;
};

interface UserInfoSectionProps {
  /** The authenticated user object */
  user: User;
  /** The user's profile data from the database */
  profile: Profile | null;
}

/**
 * Component that displays read-only user information including email, display name,
 * and account creation date in a clean card layout.
 * 
 * @param user - The authenticated user object
 * @param profile - User's profile data from the database
 * @returns JSX element containing formatted user information
 */
export function UserInfoSection({ user, profile }: UserInfoSectionProps) {
  // Format the account creation date for display
  const createdDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Account Information
            </h2>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded border">
              {user.email}
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded border">
              {profile?.display_name || 'Not set'}
            </p>
          </div>

          {/* Account Creation Date */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Account Created
            </label>
            <p className="text-gray-600 text-sm">
              {createdDate}
            </p>
          </div>

          {/* Email Verification Status */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Email Status
            </label>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                user.email_confirmed_at ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <span className={`text-sm ${
                user.email_confirmed_at ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {user.email_confirmed_at ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
          </div>
        </div>

        {/* Avatar placeholder (can be enhanced later) */}
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-500 text-2xl font-semibold">
            {(profile?.display_name || user.email || 'U')[0].toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}