/**
 * Widget Settings Panel Component
 * 
 * Provides the main interface for configuring widget settings including:
 * - Button text input
 * - Theme color picker
 * - Question text input
 * - Live widget preview
 * - Save functionality
 * - Embed code generation and copying
 * 
 * @component WidgetSettingsPanel
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FeedbackWidget } from '../../../../widget/FeedbackWidget'
import { Copy, Check, Save } from 'lucide-react'

/**
 * Configuration interface for widget settings
 */
interface WidgetConfig {
  buttonText: string
  themeColor: string
  questionText: string
  projectId: string
}

/**
 * Props for the WidgetSettingsPanel component
 */
interface WidgetSettingsPanelProps {
  projectId: string
}

/**
 * Default widget configuration values
 */
const defaultConfig: Omit<WidgetConfig, 'projectId'> = {
  buttonText: 'Feedback',
  themeColor: '#3b82f6', // Blue-500
  questionText: 'How can we improve your experience?',
}

/**
 * Widget Settings Panel component that allows users to configure
 * and preview their feedback widget settings.
 * 
 * @param props - Component props
 * @param props.projectId - The ID of the project being configured
 * @returns JSX element for the widget settings panel
 */
export default function WidgetSettingsPanel({ projectId }: WidgetSettingsPanelProps) {
  const [config, setConfig] = useState<WidgetConfig>({
    ...defaultConfig,
    projectId,
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  /**
   * Loads the current widget configuration from the API
   */
  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${projectId}/widget-settings`)
      if (response.ok) {
        const data = await response.json()
        setConfig({ ...data, projectId })
      }
    } catch (error) {
      console.error('Failed to load widget config:', error)
      // Keep default config on error
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  /**
   * Saves the current widget configuration to the API
   */
  const saveConfig = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/projects/${projectId}/widget-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      } else {
        throw new Error('Failed to save configuration')
      }
    } catch (error) {
      console.error('Failed to save widget config:', error)
      alert('Failed to save configuration. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Updates a specific field in the widget configuration
   * 
   * @param field - The field name to update
   * @param value - The new value for the field
   */
  const updateConfig = (field: keyof Omit<WidgetConfig, 'projectId'>, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  /**
   * Generates the embed code script tag for the widget
   * 
   * @returns The complete script tag as a string
   */
  const generateEmbedCode = () => {
    const baseUrl = window.location.origin
    return `<script src="${baseUrl}/widget.js" data-project-id="${projectId}" data-button-text="${config.buttonText}" data-theme-color="${config.themeColor}" data-question-text="${encodeURIComponent(config.questionText)}"></script>`
  }

  /**
   * Copies the embed code to the clipboard
   */
  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode())
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy embed code:', error)
      alert('Failed to copy embed code. Please try again.')
    }
  }

  // Load configuration on component mount
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Settings Form */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Widget Configuration
          </h2>
          
          {/* Button Text Input */}
          <div className="space-y-2">
            <label 
              htmlFor="buttonText" 
              className="block text-sm font-medium text-gray-700"
            >
              Button Text
            </label>
            <input
              type="text"
              id="buttonText"
              value={config.buttonText}
              onChange={(e) => updateConfig('buttonText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter button text..."
              maxLength={50}
            />
            <p className="text-xs text-gray-500">
              Text displayed on the feedback button
            </p>
          </div>

          {/* Theme Color Picker */}
          <div className="space-y-2">
            <label 
              htmlFor="themeColor" 
              className="block text-sm font-medium text-gray-700"
            >
              Theme Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                id="themeColor"
                value={config.themeColor}
                onChange={(e) => updateConfig('themeColor', e.target.value)}
                className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={config.themeColor}
                onChange={(e) => updateConfig('themeColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="#3b82f6"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs text-gray-500">
              Primary color for the widget elements
            </p>
          </div>

          {/* Question Text Input */}
          <div className="space-y-2">
            <label 
              htmlFor="questionText" 
              className="block text-sm font-medium text-gray-700"
            >
              Question Text
            </label>
            <textarea
              id="questionText"
              value={config.questionText}
              onChange={(e) => updateConfig('questionText', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="Enter the question text..."
              maxLength={200}
            />
            <p className="text-xs text-gray-500">
              Question shown to users when they open the widget ({config.questionText.length}/200)
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-white font-medium transition-colors ${
                saveSuccess
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : saveSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* Embed Code Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Embed Code
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Copy this code and paste it into your website to add the feedback widget.
          </p>
          
          <div className="space-y-3">
            <div className="relative">
              <pre className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {generateEmbedCode()}
              </pre>
            </div>
            
            <button
              onClick={copyEmbedCode}
              className={`w-full flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
                copySuccess
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
              }`}
            >
              {copySuccess ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Embed Code
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Widget Preview */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Live Preview
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            This is how your widget will appear on your website.
          </p>
          
          {/* Preview Container */}
          <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-8 min-h-[300px]">
            <div className="absolute inset-4 bg-white rounded shadow-sm flex items-center justify-center text-gray-500">
              <span className="text-sm">Your website content</span>
            </div>
            
            {/* Widget Preview - positioned like it would be on a real site */}
            <div className="absolute bottom-4 right-4">
              <FeedbackWidget
                projectId={projectId}
                buttonText={config.buttonText}
                themeColor={config.themeColor}
                questionText={config.questionText}
                isPreview={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}