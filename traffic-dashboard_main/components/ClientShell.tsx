"use client"
import React from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MainWrapper } from './MainWrapper'

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Isolate the login view completely from the global shell borders
  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <>
      <Topbar />
      <div className="flex min-h-screen bg-slate-50 pt-16">
        <Sidebar />
        <MainWrapper>
          {children}
        </MainWrapper>
      </div>
    </>
  )
}
