// Structured demo product catalogue. Real attributes, not AI-invented at request time.
import { RX_ONLY } from './medicines.js';

export const CATEGORIES = ['Pain relief', 'Allergy', 'Rehydration', 'Infection'];

export const CATALOG = [
  { key: 'paracetamol', name: 'Paracetamol', brand: 'Crocin / Dolo / generic', strength: '500 mg', form: 'Tablet', packSize: '10 tablets', category: 'Pain relief' },
  { key: 'ibuprofen', name: 'Ibuprofen', brand: 'Brufen / Combiflam', strength: '400 mg', form: 'Tablet', packSize: '10 tablets', category: 'Pain relief' },
  { key: 'ors', name: 'ORS', brand: 'Electral / generic', strength: 'Standard WHO formula', form: 'Oral rehydration salts', packSize: '1 sachet', category: 'Rehydration' },
  { key: 'cetirizine', name: 'Cetirizine', brand: 'Cetzine / Okacet', strength: '10 mg', form: 'Tablet', packSize: '10 tablets', category: 'Allergy' },
  { key: 'azithromycin', name: 'Azithromycin', brand: 'Azithral / Azee', strength: '500 mg', form: 'Tablet', packSize: '3 tablets', category: 'Infection' },
  { key: 'amoxicillin', name: 'Amoxicillin', brand: 'Augmentin / Mox', strength: '500 mg', form: 'Capsule', packSize: '10 capsules', category: 'Infection' },
].map((p) => ({ ...p, prescriptionRequired: RX_ONLY.has(p.key) }));

export function catalogItem(key) {
  return CATALOG.find((p) => p.key === key) || null;
}
