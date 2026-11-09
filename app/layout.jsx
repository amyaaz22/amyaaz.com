import Script from 'next/script';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GuideBall from '../components/GuideBall';
import BackToTop from '../components/BackToTop';
import { site, ORIGIN } from '../lib/content';

export const metadata = {
  metadataBase: new URL(ORIGIN),
  authors: [{ name: 'Amyaaz Aumeer' }],
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    siteName: 'Amyaaz Aumeer',
    locale: 'en_GB',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#08080c',
};

// Runs before first paint so the saved theme applies without a flash (same as the HTML build).
const themeScript = `(function(){var t=null;try{t=localStorage.getItem('theme')}catch(e){}document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark')})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700&display=swap"
        />
        <link rel="stylesheet" href="/assets/css/site.css" />
        <link rel="stylesheet" href="/assets/css/preview.css" />
      </head>
      <body className="noise">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div id="cursor" aria-hidden="true"></div>
        <div id="cursor-ring" aria-hidden="true"></div>
        <div className="grid-bg" aria-hidden="true"></div>
        <Header email={site.email} />
        {children}
        <Footer site={site} />
        <GuideBall />
        <BackToTop />
        <Script src="/assets/js/preview.js" strategy="afterInteractive" />
        <Script src="/assets/js/site.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
