import { getState } from '../../../lib/store.js';
import { DEMO_CENTER, distanceKm, isOpen } from '../../../lib/shops.js';
import { CATALOG } from '../../../lib/catalog.js';

export const dynamic = 'force-dynamic';

function hourLabel(h) {
  return `${h % 12 || 12} ${h >= 12 ? 'PM' : 'AM'}`;
}

// Storefront data: the lowest live price per medicine across partner pharmacies,
// and the partner pharmacies themselves. Both come from current stock, not a catalogue.
export async function GET() {
  const s = await getState();
  const shops = Object.values(s.shops);

  const prices = {};
  for (const p of CATALOG) {
    const offers = shops.map((sh) => sh.stock[p.key]).filter((e) => e && e.inStock && e.price);
    prices[p.key] = offers.length ? { from: Math.min(...offers.map((o) => o.price)), count: offers.length } : null;
  }

  return Response.json({
    prices,
    shops: shops
      .map((sh) => ({
        id: sh.id,
        name: sh.name,
        verified: sh.verified,
        open: isOpen(sh),
        hours: sh.hours === '24h' ? 'Open 24 hours' : `${hourLabel(sh.hours.open)} – ${hourLabel(sh.hours.close)}`,
        pharmacist: sh.pharmacistName,
        distanceKm: Math.round(distanceKm(DEMO_CENTER, sh) * 10) / 10,
        inStockCount: Object.values(sh.stock).filter((e) => e.inStock).length,
      }))
      .sort((a, b) => Number(b.open) - Number(a.open) || a.distanceKm - b.distanceKm),
  });
}
