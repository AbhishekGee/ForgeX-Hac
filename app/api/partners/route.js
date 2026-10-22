import { getState, update } from '../../../lib/store.js';
import { partnerAuthorised } from '../../../lib/auth.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  const s = await getState();
  if (!id) {
    return Response.json({
      pinRequired: Boolean(process.env.PARTNER_PIN),
      partners: Object.values(s.partners),
    });
  }
  const partner = s.partners[id];
  if (!partner) return Response.json({ error: 'Unknown delivery partner.' }, { status: 404 });
  const orders = Object.values(s.orders);
  return Response.json({
    id: partner.id,
    name: partner.name,
    available: orders
      .filter((o) => o.status === 'reserved' && !o.partnerId)
      .sort((a, b) => a.createdAt - b.createdAt),
    mine: orders
      .filter((o) => o.partnerId === id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20),
  });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (!partnerAuthorised(req, body)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });
  const { orderId, partnerId } = body;
  const result = await update((s) => {
    const order = s.orders[orderId];
    const partner = s.partners[partnerId];
    if (!order || !partner) return { status: 404, error: 'Unknown order or delivery partner.' };
    if (order.status !== 'reserved') return { status: 409, error: 'This order is not ready for pickup.' };
    if (order.partnerId) return { status: 409, error: 'Already accepted by another partner.' };
    order.partnerId = partner.id;
    order.partnerName = partner.name;
    order.updatedAt = Date.now();
    return { status: 200, order };
  });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ order: result.order });
}
