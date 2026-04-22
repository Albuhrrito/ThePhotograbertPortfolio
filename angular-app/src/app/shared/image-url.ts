import { CategorySlug } from './manifest.model';

export type Tier = 'thumb' | 'medium' | 'large' | 'full';

const BASE = 'assets';

export function imageUrl(
  category: CategorySlug | 'hero' | 'about',
  tier: Tier,
  id: string,
  format: 'webp' | 'jpg' = 'webp',
): string {
  return `${BASE}/${category}/${tier}/${id}.${format}`;
}
