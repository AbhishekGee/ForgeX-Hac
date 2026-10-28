'use client';
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo.js';
import { IconPin } from './icons.js';

const BUSINESS = [
  { href: '/pharmacy', label: 'Pharmacy console', sub: 'Stock, orders and prescriptions' },
  { href: '/partner', label: 'Delivery console', sub: 'Pickups and deliveries' },
  { href: '/admin', label: 'Admin', sub: 'Marketplace overview' },
];

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const [biz, setBiz] = useState(false);
  const bizRef = useRef(null);

  useEffect(() => {
    if (!biz) return;
    const close = (e) => { if (!bizRef.current?.contains(e.target)) setBiz(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [biz]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <a href="/" className="brand" aria-label="PharmFetch — home" title="PharmFetch">
          <span className="brand-mark" aria-hidden="true"><Logo size={30} /></span>
          <span className="brand-word" aria-hidden="true"><span>P</span><b>F</b></span>
        </a>
        <div className="nav-location">
          <IconPin size={18} />
          <div>
            <span className="nav-location-label">Delivering to</span>
            <strong>Connaught Place, New Delhi</strong>
          </div>
        </div>
        <nav className="nav-links">
          <a href="/" className="nav-link">Shop</a>
          <div className="nav-biz" ref={bizRef}>
            <button type="button" className="nav-link nav-biz-btn" aria-expanded={biz} onClick={() => setBiz(!biz)}>
              For business <span aria-hidden="true">▾</span>
            </button>
            {biz && (
              <div className="nav-menu">
                {BUSINESS.map((l) => (
                  <a key={l.href} href={l.href} className="nav-menu-item">
                    <strong>{l.label}</strong>
                    <span>{l.sub}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>
        <button type="button" className="nav-toggle" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span />
          <span />
          <span />
        </button>
      </div>
      {open && (
        <nav className="nav-sheet">
          <a href="/" className="nav-sheet-link" onClick={() => setOpen(false)}>Shop</a>
          <span className="nav-sheet-label">For business</span>
          {BUSINESS.map((l) => <a key={l.href} href={l.href} className="nav-sheet-link" onClick={() => setOpen(false)}>{l.label}</a>)}
        </nav>
      )}
    </header>
  );
}
