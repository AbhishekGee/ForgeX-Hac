import { approvedInfo } from './medicines.js';

export const GENERIC =
  'Take as written on your prescription or the pack. Ask the pharmacist if you are unsure.';

const nums = (s) => (String(s).match(/\d+/g) || []);

// Claude may only reword approved text. Any number that is not in the source is rejected.
export function groundedOk(output, source) {
  const allowed = new Set(nums(source));
  if (/[०-९]/.test(output)) return false; // Devanagari digits cannot be checked
  return nums(output).every((n) => allowed.has(n));
}

export function sourceFor(key) {
  return approvedInfo(key) || GENERIC;
}
