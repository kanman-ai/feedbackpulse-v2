/**
 * Root layout for FeedbackPulse v2 application.
 * Provides authentication context to all pages and sets up global styles.
 */
import type { Metadata } from 'next'
import { AuthProvider } from '@/contexts/auth-context'
import './globals.css'

export const metadata: Metadata = {
  title: 'FeedbackPulse',
  description: 'Lightweight SaaS for collecting and analyzing user feedback',
}

/**
 * Root layout component that wraps the entire application.
 * Provides authentication context and global styling to all pages.
 * 
 * @param children - Page components to render within the layout
 * @returns HTML document structure with authentication provider
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}