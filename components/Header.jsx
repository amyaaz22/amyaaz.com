'use client';

import { usePathname } from 'next/navigation';
import { Mark, Ball } from './Icons';

const LINKS = [
  ['services', 'Services'],
  ['work', 'Work'],
  ['articles', 'Articles'],
  ['about', 'About'],
  ['contact', 'Contact'],
];

const MEA_PATH = '/zoho-developer-middle-east-africa/';

// On the home page, links are in-page anchors; elsewhere they point back to the home page.
export default function Header({ email }) {
  const pathname = usePathname();
  const h = pathname === '/' ? '' : '/';

  return (
    <>
      <header className="nav">
        <div className="wrap nav-inner">
          <a className="brand brand-mark-only" href="/" aria-label="Amyaaz Aumeer — home">
            <Mark />
          </a>
          <nav aria-label="Primary">
            <ul className="nav-links">
              {LINKS.map(([id, label]) => (
                <li key={id}>
                  <a href={`${h}#${id}`}>{label}</a>
                </li>
              ))}
              <li>
                <a
                  href={MEA_PATH}
                  className={pathname.startsWith('/zoho-developer-middle-east-africa') ? 'active' : undefined}
                  aria-label="Zoho development for the Middle East and Africa"
                >
                  MEA
                </a>
              </li>
            </ul>
          </nav>
          <div className="nav-actions">
            <button type="button" className="icon-btn theme-toggle" aria-label="Switch to light mode">
              <svg className="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
              <svg className="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            </button>
            <a className="btn btn-primary nav-cta magnetic" href={`${h}#contact`}>
              Let&apos;s talk
            </a>
            <button type="button" className="icon-btn menu-btn" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">
              <span className="menu-btn-inner">
                <span></span>
                <span></span>
              </span>
            </button>
          </div>
        </div>
        <div className="progress" aria-hidden="true">
          <div className="progress-line"></div>
          <div className="progress-ball">
            <Ball />
          </div>
        </div>
      </header>
      <div className="mobile-menu" id="mobile-menu">
        <ul>
          {LINKS.map(([id, label], i) => (
            <li key={id}>
              <a href={`${h}#${id}`}>
                {label}
                <span>{`0${i + 1}`}</span>
              </a>
            </li>
          ))}
          <li>
            <a href={MEA_PATH}>
              Middle East &amp; Africa
              <span>{`0${LINKS.length + 1}`}</span>
            </a>
          </li>
        </ul>
        <div className="meta">
          <a href={`mailto:${email}`}>{email}</a>
          <span>Port Louis, Mauritius</span>
        </div>
      </div>
    </>
  );
}
