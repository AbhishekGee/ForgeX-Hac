// Central order state machine. Every order status transition in the app goes through here,
// so the rules (who can move an order where, and when) live in exactly one place.
import { RX_ONLY } from './medicines.js';

// Terminal states never transition again.
export const TERMINAL = new Set(['rejected', 'cancelled', 'delivered', 'failed_delivery']);

// status -> { shop: [allowed next statuses], partner: [allowed next statuses] }
const TRANSITIONS = {
  awaiting_shop: { shop: ['accepted', 'rejected'] },
  accepted: { shop: ['preparing', 'cancelled'] },
  preparing: { shop: ['ready_for_pickup', 'cancelled'] },
  ready_for_pickup: { shop: ['cancelled'], partner: ['out_for_delivery'] },
  out_for_delivery: { partner: ['delivered', 'failed_delivery'] },
};

export function prescriptionStatusFor(items) {
  return items.some((i) => RX_ONLY.has(i.key)) ? 'pending' : 'not_required';
}

export function newOrder({ id, shopId, shopName, items, hasPrescription, total }) {
  const now = Date.now();
  return {
    id,
    shopId,
    shopName,
    items,
    total,
    hasPrescription,
    status: 'awaiting_shop',
    prescriptionStatus: prescriptionStatusFor(items),
    rejectionReason: null,
    partnerId: null,
    partnerName: null,
    createdAt: now,
    updatedAt: now,
    history: [{ status: 'awaiting_shop', at: now }],
  };
}

// Throws a {status, message} shaped error-like object (never throws, returns it) on an invalid move.
export function transition(order, { actor, status, reason, note }) {
  if (TERMINAL.has(order.status)) {
    return { status: 409, error: `This order is already ${order.status.replace(/_/g, ' ')}.` };
  }
  const allowed = (TRANSITIONS[order.status] || {})[actor] || [];
  if (!allowed.includes(status)) {
    return { status: 409, error: `Cannot go from ${order.status.replace(/_/g, ' ')} to ${status.replace(/_/g, ' ')}.` };
  }
  if (status === 'preparing' && order.prescriptionStatus === 'pending') {
    return { status: 409, error: 'This order needs prescription approval before it can be prepared.' };
  }
  order.status = status;
  order.updatedAt = Date.now();
  if (status === 'rejected' || status === 'cancelled') order.rejectionReason = reason || order.rejectionReason || 'Not specified';
  order.history.push({ status, at: order.updatedAt, note });
  return { status: 200, order };
}

export function setPrescriptionStatus(order, decision, reason) {
  if (order.prescriptionStatus !== 'pending') {
    return { status: 409, error: 'This order has no prescription pending review.' };
  }
  order.prescriptionStatus = decision; // 'approved' | 'rejected'
  order.updatedAt = Date.now();
  order.history.push({ status: `prescription_${decision}`, at: order.updatedAt, note: reason });
  if (decision === 'rejected') {
    order.status = 'rejected';
    order.rejectionReason = reason || 'Prescription rejected by pharmacist.';
    order.history.push({ status: 'rejected', at: order.updatedAt });
  }
  return { status: 200, order };
}
