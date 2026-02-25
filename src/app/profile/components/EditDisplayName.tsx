/**
 * Edit Display Name Component
 * 
 * Allows users to update their display name with form validation and error handling.
 */

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { supabase } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface EditDisplayNameProps {
  /** Current display name value */
  currentDisplayName: string;
  /** Callback function to refresh profile data after successful update */
  onUpdate: () => void;
}

/**
 * Form component for editing the user's display name with validation and submission handling.
 * Includes loading states, error handling, and success feedback.
 * 
 * @param currentDisplayName - The user's current display name
 * @param onUpdate - Callback to refresh data after successful update
 * @returns JSX element containing the display name editing form
 */
export function EditDisplayName({ currentDisplayName, onUpdate }: EditDisplayNameProps) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handles form submission to update the display name
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    // Validate display name
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Display name cannot be empty');
      return;
    }

    if (trimmedName.length < 2) {
      setError('Display name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 50) {
      setError('Display name must be less than 50 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Update the display name in the profiles table
      // Use any type to bypass TypeScript strict checking for now
      const supabaseAny = supabase as any;
      const { error: updateError } = await supabaseAny
        .from('profiles')
        .update({
          display_name: trimmedName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      onUpdate(); // Refresh the profile data

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating display name:', err);
      setError('Failed to update display name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resets the form to the original display name
   */
  const handleReset = () => {
    setDisplayName(currentDisplayName);
    setError(null);
    setSuccess(false);
  };

  const hasChanges = displayName.trim() !== currentDisplayName;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Edit Display Name
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your display name"
            maxLength={50}
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            This is how your name will appear to other users.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm">Display name updated successfully!</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && <LoadingSpinner size="sm" variant="white" />}
            <span>Update Name</span>
          </button>

          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  );
}