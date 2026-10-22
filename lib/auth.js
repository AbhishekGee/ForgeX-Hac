// Shopkeeper actions need the shop PIN (if SHOP_PIN is set) or the n8n shared secret.
export function shopAuthorised(req, body = {}) {
  const pin = process.env.SHOP_PIN;
  const secret = process.env.N8N_SHARED_SECRET;
  if (secret && req.headers.get('x-webhook-secret') === secret) return true;
  if (!pin) return true;
  return body.pin === pin;
}
