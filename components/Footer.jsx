'use client';

import { usePathname } from 'next/navigation';
import { Mark } from './Icons';

export default function Footer({ site }) {
  const pathname = usePathname();
  const h = pathname === '/' ? '' : '/';

  return (
    <footer>
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <a className="brand" href="/" aria-label="Amyaaz Aumeer — home">
              <Mark />
              <span className="brand-name">
                amyaaz<b>.com</b>
              </span>
            </a>
            <p>
              Digital Solutions Architect and Zoho Developer in Mauritius. Custom Zoho Creator apps, Deluge, Flow, Catalyst and the systems around them.
            </p>
          </div>
          <div className="foot-links">
            <div>
              <span>Site</span>
              <a href={`${h}#services`}>Services</a>
              <a href={`${h}#work`}>Work</a>
              <a href="/articles/">Articles</a>
              <a href={`${h}#about`}>About</a>
            </div>
            <div>
              <span>Elsewhere</span>
              <a href={site.linkedin} target="_blank" rel="noopener me">LinkedIn</a>
              <a href={site.github} target="_blank" rel="noopener me">GitHub</a>
              <a href={site.youtube} target="_blank" rel="noopener me">YouTube</a>
              {site.writingUrl ? (
                <a href={site.writingUrl} target="_blank" rel="noopener">Writing</a>
              ) : null}
            </div>
            <div>
              <span>Contact</span>
              <a href={`mailto:${site.email}`}>Email</a>
              <a href={`${h}#contact`}>Project enquiry</a>
            </div>
          </div>
        </div>
        <div className="foot-bottom">
          <span className="avail">Available for projects · Port Louis, Mauritius</span>
          <span>© {new Date().getFullYear()} Amyaaz Aumeer</span>
        </div>
      </div>
    </footer>
  );
}
