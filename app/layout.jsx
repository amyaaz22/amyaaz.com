import Script from 'next/script';
import '@fontsource-variable/bricolage-grotesque/wght.css';
import '@fontsource-variable/hanken-grotesk/index.css';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/spline-sans-mono/index.css';
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
const homeScript = `try{if(location.pathname==='/'){var d=document.documentElement;d.classList.add('home');if(!sessionStorage.getItem('hi')&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!/[?&]nopre/.test(location.search))d.classList.add('pre')}}catch(e){}`;
const themeScript = `(function(){var t=null;try{t=localStorage.getItem('theme')}catch(e){}document.documentElement.setAttribute('data-theme',t==='dark'?'dark':'light')})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: homeScript }} />
        <link rel="stylesheet" href="/assets/css/site.css" />
        <link rel="stylesheet" href="/assets/css/preview.css" />
        <link rel="stylesheet" href="/assets/css/unslop.css" />
        <link rel="stylesheet" href="/assets/css/paper.css" />
        <link rel="stylesheet" href="/assets/css/bold.css" />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header email={site.email} />
        {children}
        <Footer site={site} />
        <BackToTop />
        <Script src="/assets/js/vendor/gsap.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/vendor/ScrollTrigger.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/vendor/lenis.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/preview.js" strategy="afterInteractive" />
        <Script src="/assets/js/site.js" strategy="afterInteractive" />
        <Script src="/assets/js/penalty.js" strategy="afterInteractive" />
        <Script src="/assets/js/motion.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
