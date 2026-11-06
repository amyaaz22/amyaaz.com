import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Amyaaz – Digital Strategy & Branding',
  description: 'Premium digital services, strategic consulting, and innovative solutions for forward-thinking brands.',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#1a1a2e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90' font-weight='bold' fill='%2322c55e'>A</text></svg>" />
      </head>
      <body className="bg-dark-950 text-dark-50 antialiased">
        {children}
      </body>
    </html>
  )
}
