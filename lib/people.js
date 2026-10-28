// Real portrait photos (Unsplash License) for the demo delivery partners, keyed by
// partner id rather than stored in state, so existing Redis data needs no migration.
const PARTNER_PHOTOS = {
  p1: '/images/rider-ravi.jpg',
  p2: '/images/rider-sunita.jpg',
  p3: '/images/rider-imran.jpg',
};

export function partnerPhoto(id) {
  return PARTNER_PHOTOS[id] || null;
}
