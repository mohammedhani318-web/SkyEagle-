/** العملة الوحيدة في المتجر حاليًا: الدولار الأمريكي */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
