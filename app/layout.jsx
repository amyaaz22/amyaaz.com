import Script from 'next/script';
import '@fontsource-variable/bricolage-grotesque/wght.css';
import '@fontsource-variable/hanken-grotesk/index.css';
import '@fontsource-variable/spline-sans-mono/index.css';
import '@fontsource/covered-by-your-grace/latin-400.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
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
  themeColor: '#f4efe6',
};

// Runs before first paint so the saved theme applies without a flash (same as the HTML build).
const gateScript = `(function(){try{var d=document.documentElement;if(location.pathname==='/')d.classList.add('home');if(location.pathname==='/'&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!localStorage.getItem('print-v1')&&!/[?&]nogate/.test(location.search)){d.classList.add('gate');setTimeout(function(){if(!window.__printReady)d.classList.remove('gate')},9000)}}catch(e){}})();`;
const themeScript = `(function(){var t=null;try{t=localStorage.getItem('theme')}catch(e){}document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light')})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: gateScript }} />
        <link rel="stylesheet" href="/assets/css/site.css" />
        <link rel="stylesheet" href="/assets/css/preview.css" />
        <link rel="stylesheet" href="/assets/css/unslop.css" />
        <link rel="stylesheet" href="/assets/css/paper.css" />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header email={site.email} />
        {children}
        <Footer site={site} />
        <BackToTop />
        <Script src="/assets/js/preview.js" strategy="afterInteractive" />
        <Script src="/assets/js/site.js" strategy="afterInteractive" />
        <Script src="/assets/js/penalty.js" strategy="afterInteractive" />
        <Script src="/assets/js/print.js" strategy="afterInteractive" />
        <Script src="/assets/js/lang.js" strategy="afterInteractive" />
        <Script src="/assets/js/builder.js" strategy="afterInteractive" />
        <Script src="/assets/js/atlas.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
