import { classify } from './medicines.js';
import { DEMO_CENTER, distanceKm, isOpen } from './shops.js';

// items: [{ key, display }]
export function rankShops(state, items, { hasPrescription = false, lat, lng, now = Date.now() } = {}) {
  const origin = { lat: lat ?? DEMO_CENTER.lat, lng: lng ?? DEMO_CENTER.lng };
  const results = Object.values(state.shops).map((shop) => {
    const open = isOpen(shop, now);
    const rows = items.map((it) => {
      const qty = Math.max(1, Math.min(20, Number(it.qty) || 1));
      const cls = classify(it.key, hasPrescription);
      if (cls === 'blocked') return { ...it, qty, status: 'blocked' };
      if (cls === 'needs_rx') return { ...it, qty, status: 'needs_rx' };
      const entry = shop.stock[it.key];
      if (!entry) return { ...it, qty, status: 'unknown' };
      return entry.inStock
        ? { ...it, qty, status: 'in_stock', price: entry.price, subtotal: entry.price * qty }
        : { ...it, qty, status: 'out' };
    });
    const inStock = rows.filter((r) => r.status === 'in_stock');
    const allAvailable = rows.length > 0 && inStock.length === rows.length;
    return {
      id: shop.id,
      name: shop.name,
      verified: shop.verified,
      open,
      distanceKm: Math.round(distanceKm(origin, shop) * 10) / 10,
      items: rows,
      inStockCount: inStock.length,
      allAvailable,
      total: allAvailable ? inStock.reduce((n, r) => n + r.subtotal, 0) : null,
    };
  });
  results.sort(
    (a, b) =>
      Number(b.open) - Number(a.open) ||
      Number(b.allAvailable) - Number(a.allAvailable) ||
      b.inStockCount - a.inStockCount ||
      a.distanceKm - b.distanceKm,
  );
  return results;
}

// Ask open shops that have no answer yet. Returns [{ shopId, key }] newly queued.
export function queueRequests(state, items, { hasPrescription = false, now = Date.now() } = {}) {
  const added = [];
  for (const shop of Object.values(state.shops)) {
    if (!isOpen(shop, now)) continue;
    for (const it of items) {
      if (classify(it.key, hasPrescription) !== 'ok') continue;
      if (shop.stock[it.key]) continue;
      if (shop.pending.includes(it.key)) continue;
      shop.pending.push(it.key);
      added.push({ shopId: shop.id, key: it.key });
    }
  }
  return added;
}
