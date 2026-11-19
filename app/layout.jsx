import Script from 'next/script';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/pinyon-script/400.css';
import '@fontsource/caveat/600.css';
import '@fontsource/special-elite/400.css';
import '@fontsource/amiri/arabic-400.css';
import '@fontsource/cairo/arabic-600.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BottomNav from '../components/BottomNav';
import Greeting from '../components/Greeting';
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
  themeColor: '#17110b',
};

// Runs before first paint so the saved theme applies without a flash (same as the HTML build).
const homeScript = `try{if(location.pathname==='/'){var d=document.documentElement;d.classList.add('home');if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&!/[?&]nopre/.test(location.search))d.classList.add('pre')}}catch(e){}`;
const themeScript = `(function(){var t=null;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',t)})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: homeScript }} />
        <link rel="stylesheet" href="/assets/css/site.css" />
        <link rel="stylesheet" href="/assets/css/codex.css" />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Greeting />
        <Header />
        {children}
        <Footer site={site} />
        <BottomNav />
        <Script src="/assets/js/vendor/gsap.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/site.js" strategy="afterInteractive" />
        <Script src="/assets/js/penalty.js" strategy="afterInteractive" />
        <Script src="/assets/js/codex.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
