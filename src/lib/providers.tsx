/**
 * Application providers setup for FeedbackPulse v2.
 * Configures React Query, auth context, and other global providers.
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@/lib/auth/auth-context'
import { Toaster } from 'sonner'

/**
 * Combined providers component for the application.
 * Sets up all necessary context providers and global state management.
 * 
 * @param children - App components to wrap with providers
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Create React Query client with sensible defaults
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: how long data stays fresh before refetch
            staleTime: 60 * 1000, // 1 minute
            // Cache time: how long data stays in cache after unused
            cacheTime: 5 * 60 * 1000, // 5 minutes
            // Retry failed requests
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (error && 'status' in error && typeof error.status === 'number') {
                if (error.status >= 400 && error.status < 500) {
                  return false
                }
              }
              // Retry up to 3 times for other errors
              return failureCount < 3
            },
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}