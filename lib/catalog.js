// Structured demo product catalogue. Real attributes, not AI-invented at request time.
import { RX_ONLY } from './medicines.js';

export const CATEGORIES = ['Pain relief', 'Allergy', 'Rehydration', 'Infection'];

export const CATALOG = [
  { key: 'paracetamol', name: 'Paracetamol', brand: 'Crocin / Dolo / generic', strength: '500 mg', form: 'Tablet', packSize: '10 tablets', units: 10, category: 'Pain relief', uses: ['Fever', 'Mild pain'] },
  { key: 'ibuprofen', name: 'Ibuprofen', brand: 'Brufen / Combiflam', strength: '400 mg', form: 'Tablet', packSize: '10 tablets', units: 10, category: 'Pain relief', uses: ['Pain', 'Inflammation', 'Fever'] },
  { key: 'ors', name: 'ORS', brand: 'Electral / generic', strength: 'Standard WHO formula', form: 'Oral rehydration salts', packSize: '1 sachet', units: 1, category: 'Rehydration', uses: ['Dehydration', 'Diarrhoea'] },
  { key: 'cetirizine', name: 'Cetirizine', brand: 'Cetzine / Okacet', strength: '10 mg', form: 'Tablet', packSize: '10 tablets', units: 10, category: 'Allergy', uses: ['Allergy', 'Runny nose', 'Itching'] },
  { key: 'azithromycin', name: 'Azithromycin', brand: 'Azithral / Azee', strength: '500 mg', form: 'Tablet', packSize: '3 tablets', units: 3, category: 'Infection', uses: ['Bacterial infections'] },
  { key: 'amoxicillin', name: 'Amoxicillin', brand: 'Augmentin / Mox', strength: '500 mg', form: 'Capsule', packSize: '10 capsules', units: 10, category: 'Infection', uses: ['Bacterial infections'] },
].map((p) => ({ ...p, prescriptionRequired: RX_ONLY.has(p.key) }));

export function catalogItem(key) {
  return CATALOG.find((p) => p.key === key) || null;
}
