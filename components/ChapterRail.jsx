'use client';

import { useEffect, useRef, useState } from 'react';

const CHAPTERS = [
  { id: 'main', label: 'Intro' },
  { id: 'atlas', label: 'Work' },
  { id: 'about', label: 'About' },
  { id: 'coach', label: 'Off the clock' },
  { id: 'regions', label: 'Reach' },
  { id: 'contact', label: 'Contact' },
];

export default function ChapterRail() {
  const [active, setActive] = useState(0);
  const [on, setOn] = useState(false);
  const raf = useRef(0);

  useEffect(() => {
    const tick = () => {
      raf.current = 0;
      const mid = window.innerHeight * 0.45;
      let cur = 0;
      CHAPTERS.forEach((c, i) => {
        const el = document.getElementById(c.id);
        if (el && el.getBoundingClientRect().top <= mid) cur = i;
      });
      setActive(cur);
      setOn(window.scrollY > window.innerHeight * 0.6);
    };
    const onScroll = () => {
      if (!raf.current) raf.current = requestAnimationFrame(tick);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    tick();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`rail${on ? ' on' : ''}`} aria-label="Page chapters">
      {CHAPTERS.map((c, i) => (
        <a key={c.id} href={`#${c.id}`} className={i === active ? 'on' : ''} aria-current={i === active ? 'true' : undefined}>
          <span>{c.label}</span>
          <i />
        </a>
      ))}
    </nav>
  );
}
