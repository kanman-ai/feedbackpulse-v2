/**
 * Demo page showcasing the FeedbackPulse widget embed functionality.
 * 
 * This page demonstrates how customers would embed the widget on their websites
 * and provides examples of different configuration options.
 */

import Script from 'next/script'

/**
 * Demo page component showing widget integration examples
 * @returns JSX element for the demo page
 */
export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            FeedbackPulse Widget Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            See how the embeddable feedback widget works on any website. 
            Click the feedback button in the bottom right to try it out!
          </p>
        </div>

        {/* Integration Examples */}
        <div className="space-y-8">
          
          {/* Basic Example */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Basic Integration
            </h2>
            <p className="text-gray-600 mb-4">
              Add this script tag to any website to enable the feedback widget:
            </p>
            <div className="bg-gray-100 rounded-md p-4 font-mono text-sm overflow-x-auto">
              <code>
{`<script 
  src="https://feedbackpulse.com/widget/embed.js" 
  data-project-id="demo-project-123"
  data-button-color="#007bff"
  data-button-label="Feedback">
</script>`}
              </code>
            </div>
          </div>

          {/* Configuration Options */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Configuration Options
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attribute
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Required
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Default
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      data-project-id
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      Yes
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Your FeedbackPulse project identifier
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      data-button-color
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      No
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #007bff
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Background color for the feedback button
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      data-button-label
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      No
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Feedback
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Text displayed on the feedback button
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      data-widget-url
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      No
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      (auto)
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      Custom URL for widget library (for self-hosting)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Styling Example */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Custom Styling Examples
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Green theme */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Green Theme</h3>
                <div className="bg-gray-100 rounded-md p-3 font-mono text-xs">
                  <code>
{`data-button-color="#28a745"
data-button-label="💬 Help"`}
                  </code>
                </div>
              </div>

              {/* Purple theme */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Purple Theme</h3>
                <div className="bg-gray-100 rounded-md p-3 font-mono text-xs">
                  <code>
{`data-button-color="#6f42c1"
data-button-label="🚀 Ideas"`}
                  </code>
                </div>
              </div>
              
            </div>
          </div>

          {/* Live Example */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Live Example
            </h2>
            <p className="text-gray-600 mb-4">
              This page has the widget enabled! Look for the feedback button in the bottom right corner.
              Try clicking it to see the feedback form in action.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> This is a demo environment. Submitted feedback will not be permanently stored.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Load the actual widget for demonstration */}
      <Script
        src="/widget/embed.js"
        data-project-id="demo-project-123"
        data-button-color="#007bff"
        data-button-label="💬 Feedback"
        strategy="afterInteractive"
      />
    </div>
  )
}