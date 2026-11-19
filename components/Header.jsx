'use client';

import { usePathname } from 'next/navigation';
import { Mark } from './Icons';

// Logo only. On the home page a click replays the greeting; elsewhere it goes home.
export default function Header() {
  const pathname = usePathname();
  const onClick = (e) => {
    if (pathname === '/' && typeof window !== 'undefined' && window.__hello) {
      e.preventDefault();
      window.__hello();
    }
  };
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a className="brand brand-mark-only" id="logo-btn" href="/" aria-label="Amyaaz Aumeer, home" onClick={onClick}>
          <Mark />
        </a>
      </div>
    </header>
  );
}
