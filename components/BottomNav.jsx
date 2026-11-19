'use client';

import { usePathname } from 'next/navigation';

const LINKS = [
  ['services', 'Services'],
  ['process', 'Process'],
  ['articles', 'Articles'],
  ['about', 'About'],
];

export default function BottomNav() {
  const pathname = usePathname();
  const h = pathname === '/' ? '' : '/';
  return (
    <nav className="dock" aria-label="Primary">
      <a className="dock-home" href="/" aria-label="Home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v9.5h13V10" />
        </svg>
      </a>
      {LINKS.map(([id, label]) => (
        <a key={id} className={`dock-link${id === 'articles' ? ' hide-s' : ''}`} href={`${h}#${id}`} data-spy={id}>
          {label}
        </a>
      ))}
      <a className="dock-link hide-s" href="/zoho-developer-middle-east-africa/">MEA</a>
      <a className="dock-cta" href={`${h}#contact`}>Contact</a>
    </nav>
  );
}
