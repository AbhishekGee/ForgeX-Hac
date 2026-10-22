import { update } from '../../../../lib/store.js';
import { shopAuthorised } from '../../../../lib/auth.js';

export const dynamic = 'force-dynamic';

const NEXT = {
  awaiting_shop: ['reserved', 'cancelled'],
  reserved: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
};

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (!shopAuthorised(req, body)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });
  const result = await update((s) => {
    const o = s.orders[body.id];
    if (!o) return { status: 404, error: 'Unknown order.' };
    if (!(NEXT[o.status] || []).includes(body.status)) return { status: 409, error: `Cannot go from ${o.status} to ${body.status}.` };
    o.status = body.status;
    o.updatedAt = Date.now();
    return { status: 200, order: o };
  });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ order: result.order });
}
