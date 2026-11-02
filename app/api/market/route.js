import { getState } from '../../../lib/store.js';
import { DEMO_CENTER, distanceKm, isOpen } from '../../../lib/shops.js';
import { CATALOG } from '../../../lib/catalog.js';

export const dynamic = 'force-dynamic';

function hourLabel(h) {
  return `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
}

// Storefront data, all derived from current pharmacy stock: every live offer per
// medicine (sorted cheapest first), its lowest price, and the partner pharmacies.
export async function GET() {
  const s = await getState();
  const shops = Object.values(s.shops).map((sh) => ({
    id: sh.id,
    name: sh.name,
    verified: sh.verified,
    open: isOpen(sh),
    hours: sh.hours === '24h' ? 'Open 24 hours' : `${hourLabel(sh.hours.open)} – ${hourLabel(sh.hours.close)}`,
    pharmacist: sh.pharmacistName,
    distanceKm: Math.round(distanceKm(DEMO_CENTER, sh) * 10) / 10,
    inStockCount: Object.values(sh.stock).filter((e) => e.inStock).length,
    stock: sh.stock,
  }));

  const offers = {};
  const prices = {};
  for (const p of CATALOG) {
    const list = shops
      .filter((sh) => sh.stock[p.key]?.inStock && sh.stock[p.key].price)
      .map((sh) => ({ shopId: sh.id, shop: sh.name, price: sh.stock[p.key].price, open: sh.open, distanceKm: sh.distanceKm, verified: sh.verified }))
      .sort((a, b) => Number(b.open) - Number(a.open) || a.price - b.price || a.distanceKm - b.distanceKm);
    offers[p.key] = list;
    const amounts = list.map((o) => o.price);
    prices[p.key] = list.length
      ? { from: Math.min(...amounts), to: Math.max(...amounts), count: list.length, openCount: list.filter((o) => o.open).length }
      : null;
  }

  return Response.json({
    prices,
    offers,
    shops: shops
      .map(({ stock, ...rest }) => rest)
      .sort((a, b) => Number(b.open) - Number(a.open) || a.distanceKm - b.distanceKm),
  });
}
