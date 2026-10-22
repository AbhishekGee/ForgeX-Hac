'use client';
import { useState } from 'react';

const LINKS = [
  { href: '/', label: 'Customer' },
  { href: '/pharmacy', label: 'Pharmacy' },
  { href: '/partner', label: 'Delivery' },
  { href: '/admin', label: 'Admin' },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <div className="nav-inner">
        <a href="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.93 4.93a10 10 0 1 1 0 14.14M12 7v5l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          PharmFetch
        </a>
        <nav className="nav-links">
          {LINKS.map((l) => <a key={l.href} href={l.href} className="nav-link">{l.label}</a>)}
        </nav>
        <button type="button" className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span />
          <span />
          <span />
        </button>
      </div>
      {open && (
        <nav className="nav-sheet">
          {LINKS.map((l) => <a key={l.href} href={l.href} className="nav-sheet-link" onClick={() => setOpen(false)}>{l.label}</a>)}
        </nav>
      )}
    </header>
  );
}
