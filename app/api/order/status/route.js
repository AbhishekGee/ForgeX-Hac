import { update } from '../../../../lib/store.js';
import { shopAuthorised, partnerAuthorised } from '../../../../lib/auth.js';
import { transition } from '../../../../lib/orders.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const actor = body.actor === 'partner' ? 'partner' : 'shop';
  if (actor === 'partner' && !partnerAuthorised(req, body)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });
  if (actor === 'shop' && !shopAuthorised(req, body)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });

  const result = await update((s) => {
    const o = s.orders[body.id];
    if (!o) return { status: 404, error: 'Unknown order.' };
    if (actor === 'partner' && o.partnerId !== body.partnerId) {
      return { status: 403, error: 'This delivery is not assigned to you.' };
    }
    return transition(o, { actor, status: body.status, reason: body.reason });
  });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ order: result.order });
}
