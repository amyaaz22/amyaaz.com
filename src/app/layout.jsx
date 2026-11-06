import './globals.css'

export const metadata = {
  title: 'Amyaaz – Digital Strategy & Branding',
  description: 'Premium digital services, strategic consulting, and innovative solutions for forward-thinking brands.',
  themeColor: '#1a1a2e',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90' font-weight='bold' fill='%2322c55e'>A</text></svg>" />
      </head>
      <body className="bg-dark-950 text-dark-50 antialiased">
        {children}
      </body>
    </html>
  )
}
