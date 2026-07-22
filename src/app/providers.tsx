import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { TooltipProvider } from '@/shared/components/ui/tooltip'
import { Toaster } from '@/shared/components/ui/sonner'
import { AuthProvider } from '@/features/auth/context/auth-provider'
import { queryClient } from '@/shared/lib/query-client'

/** Global providers: data, auth/session, tooltips and toasts. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
