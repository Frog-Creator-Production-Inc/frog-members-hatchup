'use client'

import AuthChecker from './auth-checker'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthChecker />
      {children}
    </>
  )
} 