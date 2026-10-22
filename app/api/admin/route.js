import { getState } from '../../../lib/store.js';
import { adminAuthorised } from '../../../lib/auth.js';
import { isOpen } from '../../../lib/shops.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  if (!adminAuthorised(req)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });
  const s = await getState();
  const orders = Object.values(s.orders).sort((a, b) => b.createdAt - a.createdAt);

  const byStatus = {};
  let revenue = 0;
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    if (o.status === 'delivered') revenue += o.total;
  }

  return Response.json({
    pinRequired: Boolean(process.env.ADMIN_PIN),
    metrics: {
      totalOrders: orders.length,
      byStatus,
      revenue,
      pharmacyCount: Object.keys(s.shops).length,
      partnerCount: Object.keys(s.partners).length,
      pendingReviews: s.reviews.length,
    },
    orders: orders.slice(0, 30),
    pharmacies: Object.values(s.shops).map((x) => ({ id: x.id, name: x.name, open: isOpen(x), items: Object.keys(x.stock).length })),
    partners: Object.values(s.partners).map((p) => ({
      ...p,
      activeDeliveries: orders.filter((o) => o.partnerId === p.id && o.status !== 'delivered' && o.status !== 'cancelled').length,
    })),
    reviews: s.reviews.slice(0, 10),
  });
}
