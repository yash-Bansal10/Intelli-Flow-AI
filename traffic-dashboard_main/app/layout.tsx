import type React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Analytics } from '@vercel/analytics/next';
import { Suspense } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { SidebarProvider } from '@/context/SidebarContext';
import { HardwareHealthProvider } from '@/context/HardwareHealthContext';
import { MainWrapper } from '@/components/MainWrapper';

export const metadata: Metadata = {
  title: 'Intelli-Flow AI Dashboard',
  description: 'Live Traffic Management Command Center',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <HardwareHealthProvider>
            <SidebarProvider>
              <Topbar />
              <div className="flex min-h-screen bg-slate-50 pt-16">
                <Sidebar />
                <MainWrapper>
                  <Suspense fallback={null}>{children}</Suspense>
                </MainWrapper>
              </div>
            </SidebarProvider>
          </HardwareHealthProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}