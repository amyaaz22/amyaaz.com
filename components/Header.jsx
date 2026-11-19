'use client';

import { usePathname } from 'next/navigation';
import { Mark } from './Icons';

// Wax-seal logo (replays the opening on the home page) plus theme and sound switches.
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
      <div className="nav-inner">
        <a className="brand brand-mark-only" id="logo-btn" href="/" aria-label="Amyaaz Aumeer, home" onClick={onClick}>
          <Mark />
        </a>
        <div className="nav-tools">
          <button className="icon-btn snd-toggle" id="snd-toggle" type="button" aria-pressed="false" aria-label="Page sounds">
            <svg className="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="m16.5 9.5 4 5m0-5-4 5" /></svg>
            <svg className="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></svg>
          </button>
          <button className="icon-btn theme-toggle" type="button" aria-label="Switch to dark mode">
            <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" /></svg>
            <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7z" /></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
