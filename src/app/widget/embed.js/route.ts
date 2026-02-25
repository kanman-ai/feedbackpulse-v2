/**
 * API route to serve the embed script as a static file with proper headers.
 * 
 * This route serves the embed.js file with appropriate caching headers
 * and CORS settings to allow embedding on any domain.
 */

import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import path from 'path'

/**
 * Handles GET requests for the embed script
 * @returns Response with the embed script content
 */
export async function GET() {
  try {
    // Read the embed script file
    const embedScriptPath = path.join(process.cwd(), 'src', 'widget', 'embed.js')
    const embedScript = readFileSync(embedScriptPath, 'utf-8')

    // Return the script with appropriate headers
    return new NextResponse(embedScript, {
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
    console.error('Error serving embed script:', error)
    
    return new NextResponse('Script not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}