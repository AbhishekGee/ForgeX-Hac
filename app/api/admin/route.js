import { getState } from '../../../lib/store.js';
import { adminAuthorised } from '../../../lib/auth.js';
import { isOpen } from '../../../lib/shops.js';

export const dynamic = 'force-dynamic';

const COMMISSION_RATE = 0.1; // Demo platform commission on delivered orders. Not a real pricing decision.

function confirmationMs(order) {
  const placed = order.history.find((h) => h.status === 'awaiting_shop');
  const accepted = order.history.find((h) => h.status === 'accepted');
  if (!placed || !accepted) return null;
  return accepted.at - placed.at;
}

export async function GET(req) {
  if (!adminAuthorised(req)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });
  const s = await getState();
  const orders = Object.values(s.orders).sort((a, b) => b.createdAt - a.createdAt);

  const byStatus = {};
  let grossOrderValue = 0;
  let platformRevenue = 0;
  let acceptedOrRejected = 0;
  let acceptedCount = 0;
  let rejectedCount = 0;
  let deliveredCount = 0;
  let failedCount = 0;
  let stockFailures = 0;
  let pendingPrescriptionReviews = 0;
  const confirmTimes = [];

  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    grossOrderValue += o.total;
    if (o.status === 'delivered') { platformRevenue += Math.round(o.total * COMMISSION_RATE); deliveredCount += 1; }
    if (o.status === 'failed_delivery') failedCount += 1;
    if (o.status === 'rejected' || o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready_for_pickup' || o.status === 'out_for_delivery' || o.status === 'delivered' || o.status === 'failed_delivery') {
      acceptedOrRejected += 1;
      if (o.status === 'rejected') rejectedCount += 1; else acceptedCount += 1;
    }
    if (o.status === 'rejected' && /out of stock/i.test(o.rejectionReason || '')) stockFailures += 1;
    if (o.prescriptionStatus === 'pending') pendingPrescriptionReviews += 1;
    const ms = confirmationMs(o);
    if (ms !== null) confirmTimes.push(ms);
  }

  const acceptanceRate = acceptedOrRejected ? Math.round((acceptedCount / acceptedOrRejected) * 100) : null;
  const rejectionRate = acceptedOrRejected ? Math.round((rejectedCount / acceptedOrRejected) * 100) : null;
  const deliveryAttempts = deliveredCount + failedCount;
  const deliveryCompletionRate = deliveryAttempts ? Math.round((deliveredCount / deliveryAttempts) * 100) : null;
  const avgConfirmationSec = confirmTimes.length ? Math.round(confirmTimes.reduce((a, b) => a + b, 0) / confirmTimes.length / 1000) : null;

  return Response.json({
    pinRequired: Boolean(process.env.ADMIN_PIN),
    metrics: {
      totalOrders: orders.length,
      byStatus,
      grossOrderValue,
      platformRevenue,
      commissionRate: COMMISSION_RATE,
      acceptanceRate,
      rejectionRate,
      deliveryCompletionRate,
      avgConfirmationSec,
      stockFailures,
      pendingPrescriptionReviews,
      pendingOcrReviews: s.reviews.length,
      pharmacyCount: Object.keys(s.shops).length,
      partnerCount: Object.keys(s.partners).length,
    },
    orders: orders.slice(0, 30),
    rejectedOrders: orders.filter((o) => o.status === 'rejected').slice(0, 10),
    pharmacies: Object.values(s.shops).map((x) => ({ id: x.id, name: x.name, open: isOpen(x), verified: x.verified, items: Object.keys(x.stock).length })),
    partners: Object.values(s.partners).map((p) => ({
      ...p,
      activeDeliveries: orders.filter((o) => o.partnerId === p.id && !['delivered', 'cancelled', 'failed_delivery'].includes(o.status)).length,
      completedDeliveries: orders.filter((o) => o.partnerId === p.id && o.status === 'delivered').length,
    })),
    reviews: s.reviews.slice(0, 10),
  });
}
