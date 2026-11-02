'use client';
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo.js';
import { IconPin, IconSearch, IconCart } from './icons.js';
import { loadCart, cartCount } from '../../lib/cart.js';

const BUSINESS = [
  { href: '/pharmacy', label: 'Pharmacy console', sub: 'Stock, orders and prescriptions' },
  { href: '/partner', label: 'Delivery console', sub: 'Pickups and deliveries' },
  { href: '/admin', label: 'Admin', sub: 'Marketplace overview' },
];

const onStore = () => window.location.pathname === '/';

export default function NavBar() {
  const [q, setQ] = useState('');
  const [count, setCount] = useState(0);
  const [biz, setBiz] = useState(false);
  const [sheet, setSheet] = useState(false);
  const bizRef = useRef(null);

  useEffect(() => {
    setCount(cartCount(loadCart()));
    const onCart = (e) => setCount(cartCount(e.detail || []));
    window.addEventListener('pf:cart', onCart);
    return () => window.removeEventListener('pf:cart', onCart);
  }, []);

  useEffect(() => {
    if (!biz) return;
    const close = (e) => { if (!bizRef.current?.contains(e.target)) setBiz(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [biz]);

  function submit(e) {
    e.preventDefault();
    const text = q.trim();
    if (!text) return;
    setQ('');
    if (onStore()) window.dispatchEvent(new CustomEvent('pf:search', { detail: text }));
    else window.location.href = '/?q=' + encodeURIComponent(text);
  }

  function openCart() {
    if (onStore()) window.dispatchEvent(new CustomEvent('pf:open-cart'));
    else window.location.href = '/?cart=1';
  }

  return (
    <header className="hdr">
      <div className="hdr-row">
        <a href="/" className="brand" aria-label="PharmFetch — home" title="PharmFetch">
          <Logo size={34} />
          <span className="brand-word" aria-hidden="true">P<b>F</b></span>
        </a>

        <div className="hdr-loc" title="Prices and distances are shown for this area">
          <IconPin size={18} />
          <span>
            <small>Delivering to</small>
            <strong>Connaught Place, New Delhi</strong>
          </span>
        </div>

        <form className="hdr-search" onSubmit={submit} role="search">
          <IconSearch size={19} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search medicines, e.g. Dolo 650, ORS"
            aria-label="Search medicines"
          />
          <button type="submit" className="hdr-search-btn" disabled={!q.trim()}>Search</button>
        </form>

        <div className="hdr-actions">
          <div className="hdr-biz" ref={bizRef}>
            <button type="button" className="hdr-link" aria-expanded={biz} onClick={() => setBiz(!biz)}>
              For business <span aria-hidden="true">▾</span>
            </button>
            {biz && (
              <div className="menu">
                {BUSINESS.map((l) => (
                  <a key={l.href} href={l.href} className="menu-item">
                    <strong>{l.label}</strong>
                    <span>{l.sub}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="hdr-cart" onClick={openCart} aria-label={`Cart, ${count} items`}>
            <IconCart size={20} />
            <span className="hdr-cart-label">Cart</span>
            {count > 0 && <span className="hdr-badge">{count}</span>}
          </button>
          <button type="button" className="hdr-menu" aria-label="Menu" aria-expanded={sheet} onClick={() => setSheet(!sheet)}>
            <span /><span /><span />
          </button>
        </div>
      </div>

      {sheet && (
        <nav className="sheet">
          <a href="/" className="sheet-link">Shop medicines</a>
          <a href="/#pharmacies" className="sheet-link" onClick={() => setSheet(false)}>Partner pharmacies</a>
          <span className="sheet-label">For business</span>
          {BUSINESS.map((l) => <a key={l.href} href={l.href} className="sheet-link">{l.label}</a>)}
        </nav>
      )}
    </header>
  );
}
