'use client';
import { useState } from 'react';
import { IconBike } from './icons.js';

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
            <IconBike size={20} />
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
