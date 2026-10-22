import { update } from '../../../../lib/store.js';
import { shopAuthorised, partnerAuthorised } from '../../../../lib/auth.js';

export const dynamic = 'force-dynamic';

const SHOP_NEXT = {
  awaiting_shop: ['reserved', 'cancelled'],
  reserved: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
};
const PARTNER_NEXT = {
  reserved: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const actor = body.actor === 'partner' ? 'partner' : 'shop';
  if (actor === 'partner' && !partnerAuthorised(req, body)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });
  if (actor === 'shop' && !shopAuthorised(req, body)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });
  const result = await update((s) => {
    const o = s.orders[body.id];
    if (!o) return { status: 404, error: 'Unknown order.' };
    if (actor === 'partner') {
      if (o.partnerId !== body.partnerId) return { status: 403, error: 'This delivery is not assigned to you.' };
      if (!(PARTNER_NEXT[o.status] || []).includes(body.status)) return { status: 409, error: `Cannot go from ${o.status} to ${body.status}.` };
    } else if (!(SHOP_NEXT[o.status] || []).includes(body.status)) {
      return { status: 409, error: `Cannot go from ${o.status} to ${body.status}.` };
    }
    o.status = body.status;
    o.updatedAt = Date.now();
    return { status: 200, order: o };
  });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ order: result.order });
}
