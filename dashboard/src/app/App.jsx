import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from '@/i18n'
import { queryClient } from '@/lib/queryClient'
import { ConfirmProvider, ToastProvider } from '@/ui'
import { AppRoutes } from './AppRoutes'
import { AuthProvider } from './AuthProvider'

/** Everything that hooks and kit components rely on, in the required order. */
export function AppProviders({ children, client = queryClient }) {
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </LanguageProvider>
    </QueryClientProvider>
  )
}

export default function App() {
  return (
    <AppProviders>
      {/* basename strips the deploy prefix (see vite.config.js's `base`) so every route below stays unprefixed
          ('/faqs', '/login'…) — matches vite.config.js `base` and Vercel's proxy rewrite of that prefix to this app. */}
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </AppProviders>
  )
}
