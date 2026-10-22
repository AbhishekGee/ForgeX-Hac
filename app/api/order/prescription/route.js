import { update } from '../../../../lib/store.js';
import { shopAuthorised } from '../../../../lib/auth.js';
import { setPrescriptionStatus } from '../../../../lib/orders.js';

export const dynamic = 'force-dynamic';

// A pharmacist approves or rejects the prescription attached to a specific order.
// Rejecting blocks the order from ever being prepared or dispensed.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (!shopAuthorised(req, body)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });
  const decision = body.decision === 'rejected' ? 'rejected' : 'approved';

  const result = await update((s) => {
    const o = s.orders[body.id];
    if (!o) return { status: 404, error: 'Unknown order.' };
    return setPrescriptionStatus(o, decision, body.reason);
  });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ order: result.order });
}
