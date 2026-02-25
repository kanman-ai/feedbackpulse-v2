/**
 * Root layout component for FeedbackPulse v2.
 * Provides global styling, auth context, and metadata for the entire application.
 * Wraps all pages with necessary providers and layout structure.
 */
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth/auth-context'

/**
 * Inter font configuration for consistent typography.
 * Loads Latin character subset for optimal performance.
 */
const inter = Inter({ subsets: ['latin'] })

/**
 * Application metadata for SEO and social sharing.
 * Defines title, description, and other meta properties.
 */
export const metadata: Metadata = {
  title: 'FeedbackPulse v2',
  description: 'Modern feedback collection and analysis platform',
  keywords: ['feedback', 'analytics', 'customer experience', 'surveys'],
  authors: [{ name: 'FeedbackPulse Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

/**
 * Root Layout Component.
 * Provides the base HTML structure and wraps the app with necessary providers.
 * All pages inherit this layout and have access to auth context.
 * 
 * @param props - Component props containing child page components
 * @returns JSX element with HTML structure and auth provider
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
