/**
 * API Route for Widget Settings
 * 
 * Handles GET and POST requests for project-specific widget configuration.
 * Stores settings like button text, theme color, and question text in the database.
 * 
 * Routes:
 * - GET /api/projects/[id]/widget-settings - Retrieve widget settings
 * - POST /api/projects/[id]/widget-settings - Save widget settings
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Widget configuration interface for API requests/responses
 */
interface WidgetSettings {
  buttonText: string
  themeColor: string
  questionText: string
  projectId: string
}

/**
 * Default widget settings used when no configuration exists
 */
const defaultSettings: Omit<WidgetSettings, 'projectId'> = {
  buttonText: 'Feedback',
  themeColor: '#3b82f6',
  questionText: 'How can we improve your experience?',
}

/**
 * In-memory storage for widget settings (temporary implementation)
 * In a real application, this would be replaced with database storage
 */
const widgetSettingsStore: Map<string, WidgetSettings> = new Map()

/**
 * GET handler - Retrieves widget settings for a project
 * 
 * @param request - The incoming request object
 * @param context - Route context containing project ID parameter
 * @returns JSON response with widget settings or default values
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Validate project ID
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Retrieve settings from storage or use defaults
    const settings = widgetSettingsStore.get(projectId) || {
      ...defaultSettings,
      projectId,
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error retrieving widget settings:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve widget settings' },
      { status: 500 }
    )
  }
}

/**
 * POST handler - Saves widget settings for a project
 * 
 * @param request - The incoming request object with settings data
 * @param context - Route context containing project ID parameter
 * @returns JSON response confirming save operation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Validate project ID
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { buttonText, themeColor, questionText } = body

    // Validate required fields
    if (!buttonText || !themeColor || !questionText) {
      return NextResponse.json(
        { error: 'Missing required fields: buttonText, themeColor, questionText' },
        { status: 400 }
      )
    }

    // Validate field formats and lengths
    if (typeof buttonText !== 'string' || buttonText.length > 50) {
      return NextResponse.json(
        { error: 'Button text must be a string with maximum 50 characters' },
        { status: 400 }
      )
    }

    if (typeof themeColor !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(themeColor)) {
      return NextResponse.json(
        { error: 'Theme color must be a valid hex color code (e.g., #3b82f6)' },
        { status: 400 }
      )
    }

    if (typeof questionText !== 'string' || questionText.length > 200) {
      return NextResponse.json(
        { error: 'Question text must be a string with maximum 200 characters' },
        { status: 400 }
      )
    }

    // Create settings object
    const settings: WidgetSettings = {
      buttonText: buttonText.trim(),
      themeColor: themeColor.toLowerCase(),
      questionText: questionText.trim(),
      projectId,
    }

    // Store settings (in production, this would be saved to a database)
    widgetSettingsStore.set(projectId, settings)

    return NextResponse.json({
      message: 'Widget settings saved successfully',
      settings,
    })
  } catch (error) {
    console.error('Error saving widget settings:', error)
    return NextResponse.json(
      { error: 'Failed to save widget settings' },
      { status: 500 }
    )
  }
}