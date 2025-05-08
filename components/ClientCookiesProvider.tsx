'use client'

import { createContext, useContext, ReactNode } from 'react'

export type Cookie = {
  name: string
  value: string
}

export type CookieContextType = Cookie[]

export const CookieContext = createContext<CookieContextType>([])

export function useClientCookies(): CookieContextType {
  return useContext(CookieContext)
}

interface ClientCookiesProviderProps {
  value: CookieContextType
  children: ReactNode
}

export function ClientCookiesProvider({ value, children }: ClientCookiesProviderProps) {
  return (
    <CookieContext.Provider value={value}>{children}</CookieContext.Provider>
  )
} 