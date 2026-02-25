/**
 * Widget Settings Page Component
 * 
 * Page at /projects/:id/widget-settings that provides configuration interface
 * for feedback widget settings including button text, theme color, and question text.
 * Includes live preview and embed code generation.
 * 
 * @component WidgetSettingsPage
 */

import { Suspense } from 'react'
import WidgetSettingsPanel from './WidgetSettingsPanel'

/**
 * Widget settings page that handles project-specific widget configuration.
 * 
 * @param props - Component props
 * @param props.params - Route parameters containing project ID
 * @returns JSX element for the widget settings page
 */
export default function WidgetSettingsPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Widget Settings
          </h1>
          <p className="mt-2 text-gray-600">
            Configure your feedback widget appearance and behavior
          </p>
        </div>

        <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
          <WidgetSettingsPanel projectId={params.id} />
        </Suspense>
      </div>
    </div>
  )
}