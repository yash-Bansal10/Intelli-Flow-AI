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

export const metadata: Metadata = {
  title: 'Intelli-Flow AI Dashboard', // Updated title
  description: 'Live Traffic Management Command Center', // Updated description
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // Add suppressHydrationWarning to the <html> tag
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Wrap your children with the ThemeProvider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Topbar />
          <div className="flex min-h-screen bg-slate-50 pt-16">
            <Sidebar />
            <main className="flex-1 ml-16 lg:ml-64 p-4 sm:p-6 transition-all duration-300 bg-white shadow-[0_0_15px_rgba(0,0,0,0.02)] min-h-[calc(100vh-4rem)]">
              <Suspense fallback={null}>{children}</Suspense>
            </main>
          </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}