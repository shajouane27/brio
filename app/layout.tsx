import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Brio – Prépare tes examens',
  description: 'Application de préparation aux examens pour les élèves français du CP à la Terminale',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Brio',
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`h-full ${inter.variable}`}>
      <body className="min-h-full antialiased bg-[#FAFAF9] text-slate-900 font-sans">
        {children}
      </body>
    </html>
  )
}
