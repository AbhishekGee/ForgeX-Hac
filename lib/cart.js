// Client-side cart, kept in localStorage so it survives page changes, and announced
// with a window event so the header's cart badge stays in sync.
const KEY = 'pharmfetch_cart';

export function loadCart() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

export function saveCart(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  window.dispatchEvent(new CustomEvent('pf:cart', { detail: items }));
}

export function cartCount(items) {
  return items.reduce((n, m) => n + (m.qty || 1), 0);
}
