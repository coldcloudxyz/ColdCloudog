import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: 'ColdCloud AI Lead Engine — Find Leads & Book Meetings with AI',
  description: 'Automatically find leads, generate personalized outreach, and book meetings using AI. Built for agencies, SaaS founders, and B2B businesses.',
  keywords: ['lead generation', 'AI outreach', 'sales automation', 'cold email', 'meeting booking'],
  openGraph: {
    title: 'ColdCloud AI Lead Engine',
    description: 'Automatically find leads and book meetings using AI',
    type: 'website',
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--toast-bg)',
              color: 'var(--toast-color)',
              border: '1px solid var(--toast-border)',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  )
}
