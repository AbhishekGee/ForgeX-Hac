import { redirect } from 'next/navigation';

// Moved to /pharmacy. This stub keeps the old link working.
export default function ShopRedirect() {
  redirect('/pharmacy');
}
