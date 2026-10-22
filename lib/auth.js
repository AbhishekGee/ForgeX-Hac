// Shopkeeper actions need the shop PIN (if SHOP_PIN is set) or the n8n shared secret.
export function shopAuthorised(req, body = {}) {
  const pin = process.env.SHOP_PIN;
  const secret = process.env.N8N_SHARED_SECRET;
  if (secret && req.headers.get('x-webhook-secret') === secret) return true;
  if (!pin) return true;
  return body.pin === pin;
}

// Delivery partner actions need the partner PIN (if PARTNER_PIN is set).
export function partnerAuthorised(req, body = {}) {
  const pin = process.env.PARTNER_PIN;
  if (!pin) return true;
  return body.pin === pin;
}

// Admin dashboard reads need the admin PIN, sent as a header (never logged in a URL).
export function adminAuthorised(req) {
  const pin = process.env.ADMIN_PIN;
  if (!pin) return true;
  return req.headers.get('x-admin-pin') === pin;
}
