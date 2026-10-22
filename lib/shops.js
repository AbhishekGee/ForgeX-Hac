// Demo chemists. All names and locations are invented for the prototype.
export const DEMO_CENTER = { lat: 28.6139, lng: 77.209 };

const SEED_SHOPS = [
  {
    id: 's1', name: 'Sharma Medical Store (demo)', lat: 28.6165, lng: 77.2105, hours: '24h',
    licenceNo: 'DL-20B-11042-DEMO', pharmacistName: 'R. Sharma, RPh (demo)', verified: true,
    stock: {
      paracetamol: { inStock: true, price: 22 },
      ors: { inStock: true, price: 20 },
      cetirizine: { inStock: false },
    },
  },
  {
    id: 's2', name: 'Gupta Chemist (demo)', lat: 28.6101, lng: 77.2152, hours: { open: 9, close: 22 },
    licenceNo: 'DL-20B-11087-DEMO', pharmacistName: 'A. Gupta, RPh (demo)', verified: true,
    stock: { paracetamol: { inStock: true, price: 25 }, ibuprofen: { inStock: true, price: 38 } },
  },
  {
    id: 's3', name: 'City Care Pharmacy (demo)', lat: 28.6188, lng: 77.2031, hours: { open: 8, close: 23 },
    licenceNo: 'DL-20B-11129-DEMO', pharmacistName: 'S. Rao, RPh (demo)', verified: true,
    stock: { cetirizine: { inStock: true, price: 30 }, ors: { inStock: true, price: 22 }, azithromycin: { inStock: true, price: 95 } },
  },
  {
    id: 's4', name: 'Night Owl Medicos (demo)', lat: 28.6072, lng: 77.2011, hours: '24h',
    licenceNo: 'DL-20B-11176-DEMO', pharmacistName: 'N. Verma, RPh (demo)', verified: true,
    stock: { ibuprofen: { inStock: true, price: 40 }, ors: { inStock: false } },
  },
  {
    id: 's5', name: 'Lal Dawakhana (demo)', lat: 28.6213, lng: 77.2188, hours: { open: 10, close: 20 },
    licenceNo: 'DL-20B-11203-DEMO', pharmacistName: null, verified: false,
    stock: { paracetamol: { inStock: true, price: 21 } },
  },
];

// Demo delivery partners. Invented for the prototype.
const SEED_PARTNERS = [
  { id: 'p1', name: 'Ravi Kumar', phone: '91XXXXXXXX01', vehicle: 'Bike', verified: true },
  { id: 'p2', name: 'Sunita Devi', phone: '91XXXXXXXX02', vehicle: 'Scooter', verified: true },
  { id: 'p3', name: 'Imran Shaikh', phone: '91XXXXXXXX03', vehicle: 'Bike', verified: false },
];

export function seedState() {
  const shops = {};
  for (const s of SEED_SHOPS) {
    const stock = {};
    for (const [k, v] of Object.entries(s.stock)) stock[k] = { ...v, updatedAt: Date.now() };
    shops[s.id] = { ...s, stock, pending: [] };
  }
  const partners = {};
  for (const p of SEED_PARTNERS) partners[p.id] = { ...p };
  return { shops, partners, orders: {}, reviews: [] };
}

export function istHour(now = Date.now()) {
  const h = new Date(now).toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric',
  });
  return Number(h) % 24;
}

export function isOpen(shop, now = Date.now()) {
  if (shop.hours === '24h') return true;
  const h = istHour(now);
  const { open, close } = shop.hours;
  return open <= close ? h >= open && h < close : h >= open || h < close;
}

export function distanceKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
