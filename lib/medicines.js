// Demo medicine knowledge. In production, replace with a licensed drug database
// and pharmacist-approved label text.

const BRANDS = {
  crocin: 'paracetamol', dolo: 'paracetamol', calpol: 'paracetamol', paracip: 'paracetamol',
  acetaminophen: 'paracetamol',
  electral: 'ors', 'oral rehydration': 'ors', 'oral rehydration salts': 'ors',
  cetzine: 'cetirizine', okacet: 'cetirizine', alerid: 'cetirizine',
  brufen: 'ibuprofen', combiflam: 'ibuprofen',
  azithral: 'azithromycin', azee: 'azithromycin',
  augmentin: 'amoxicillin', mox: 'amoxicillin',
  xanax: 'alprazolam', ultracet: 'tramadol', nucynta: 'tapentadol',
  ambien: 'zolpidem', rivotril: 'clonazepam', valium: 'diazepam',
};

// Never offered in the MVP (controlled substances).
export const CONTROLLED = new Set([
  'alprazolam', 'tramadol', 'tapentadol', 'zolpidem', 'clonazepam', 'diazepam', 'codeine', 'fentanyl',
]);

// Offered only when a prescription was uploaded, and always pharmacist-checked.
export const RX_ONLY = new Set(['amoxicillin', 'azithromycin', 'oseltamivir', 'pantoprazole']);

const FORM_WORDS = /\b(tablets?|tabs?|capsules?|caps?|syrup|sachets?|drops?|ip|sr|mg|mcg|ml|g)\b/g;

export function normalise(raw) {
  let s = String(raw || '').toLowerCase().trim();
  s = s.replace(/[0-9]+(\.[0-9]+)?\s*(mg|mcg|ml|g)?/g, ' ');
  s = s.replace(FORM_WORDS, ' ').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (BRANDS[s]) return BRANDS[s];
  for (const [brand, generic] of Object.entries(BRANDS)) {
    if (s === brand || s.startsWith(brand + ' ')) return generic;
  }
  return s;
}

export function classify(key, hasPrescription) {
  if (CONTROLLED.has(key)) return 'blocked';
  if (RX_ONLY.has(key) && !hasPrescription) return 'needs_rx';
  return 'ok';
}

// DEMO TEXT. Must be replaced with pharmacist-approved label text before real use.
// Deliberately contains no dose numbers: dosing always comes from the prescription or pack.
export const APPROVED_INFO = {
  paracetamol:
    'Used for fever and mild pain. Take exactly as written on your prescription or the pack. Do not go over the maximum daily amount on the pack, and do not combine with other medicines that contain paracetamol.',
  ors:
    'Replaces fluids and salts lost with diarrhoea or vomiting. Mix one sachet in the amount of clean water printed on the sachet and sip often. Throw away any made-up solution after 24 hours.',
  cetirizine:
    'Used for allergy symptoms such as sneezing and itching. It can cause drowsiness, so avoid driving until you know how it affects you. Take as written on your prescription or the pack.',
  ibuprofen:
    'Used for pain and fever. Take after food. It is not suitable for everyone, for example people with stomach ulcers or asthma, unless a doctor has said it is fine. Take as written on your prescription or the pack.',
};

export function approvedInfo(key) {
  return APPROVED_INFO[key] || null;
}
