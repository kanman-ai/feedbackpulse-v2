/**
 * User Projects Component
 * 
 * Displays a list of projects associated with the user, showing their role
 * (owner or team member) and basic project information.
 */

// Basic project type
type Project = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string | null;
};

interface UserProject extends Project {
  role: 'owner' | 'member';
}

interface UserProjectsProps {
  /** Array of projects with user roles */
  projects: UserProject[];
}

/**
 * Component that displays a user's projects in a grid layout with role indicators.
 * Shows project name, description, creation date, and the user's role in each project.
 * 
 * @param projects - Array of projects with associated user roles
 * @returns JSX element containing a formatted list of user projects
 */
export function UserProjects({ projects }: UserProjectsProps) {
  /**
   * Formats a date string into a readable format
   * @param dateString - ISO date string to format
   * @returns Formatted date string
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  /**
   * Gets the appropriate styling for a role badge
   * @param role - The user's role in the project
   * @returns CSS classes for the role badge
   */
  const getRoleBadgeStyle = (role: 'owner' | 'member') => {
    return role === 'owner'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-green-100 text-green-800';
  };

  /**
   * Gets the role display text
   * @param role - The user's role in the project
   * @returns Formatted role text
   */
  const getRoleText = (role: 'owner' | 'member') => {
    return role === 'owner' ? 'Owner' : 'Team Member';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Your Projects
        </h3>
        <span className="text-sm text-gray-600">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      {projects.length === 0 ? (
        // Empty state when user has no projects
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h4>
          <p className="text-gray-600">
            You haven't created or joined any projects. Start by creating your first project!
          </p>
        </div>
      ) : (
        // Project grid layout
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              {/* Project Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {project.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Created {formatDate(project.created_at)}
                  </p>
                </div>
                
                {/* Role Badge */}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeStyle(project.role)}`}>
                  {getRoleText(project.role)}
                </span>
              </div>

              {/* Project Description */}
              {project.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Project Actions */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  ID: {project.id.slice(0, 8)}...
                </span>
                <button
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => {
                    // TODO: Navigate to project details
                    console.log('Navigate to project:', project.id);
                  }}
                >
                  View →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Statistics */}
      {projects.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.role === 'owner').length}
              </p>
              <p className="text-sm text-gray-600">Owned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.role === 'member').length}
              </p>
              <p className="text-sm text-gray-600">Member</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {projects.length}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}