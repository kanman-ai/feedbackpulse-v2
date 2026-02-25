/**
 * API route to serve the widget library script as a static file with proper headers.
 * 
 * This route serves the widget.js file with appropriate caching headers
 * and CORS settings to allow loading from any domain where the embed script is used.
 */

import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * Handles GET requests for the widget library script
 * @returns Response with the widget script content
 */
export async function GET() {
  try {
    // Read the widget script file
    const widgetScriptPath = path.join(process.cwd(), 'src', 'widget', 'widget.js')
    const widgetScript = readFileSync(widgetScriptPath, 'utf-8')

    // Return the script with appropriate headers
    return new NextResponse(widgetScript, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('Error serving widget script:', error)
    
    return new NextResponse('Script not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}