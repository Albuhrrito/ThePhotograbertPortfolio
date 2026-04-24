export interface ExifInfo {
  camera?: string;
  make?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: number;
  focal?: string;
  date?: string;
}

export interface ManifestEntry {
  id: string;
  alt: string;
  w: number;
  h: number;
  ar: number;
  lqip: string;
  exif: ExifInfo;
}

export type CategorySlug =
  | 'portraits'
  | 'modeling'
  | 'sports'
  | 'street'
  | 'products'
  | 'graduation'
  | 'aesthetics';

export interface CategoryMeta {
  slug: CategorySlug;
  title: string;
  description: string;
  heroImageId?: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: 'portraits',
    title: 'Portraits',
    description:
      'Faces at rest — the half-second before a practiced expression takes over.',
  },
  {
    slug: 'modeling',
    title: 'Modeling',
    description:
      'Editorial and studio work with models, stylists, and MUAs who trust the frame.',
    heroImageId: 'DSCF2098',
  },
  {
    slug: 'sports',
    title: 'Sports',
    description:
      'Action at full speed — powerlifting, hockey, and wherever else a shutter belongs.',
    heroImageId: 'DSCF2640',
  },
  {
    slug: 'street',
    title: 'Street',
    description:
      "Strangers in mid-motion, on blocks I'd likely never walk twice.",
    heroImageId: 'DSCF9648',
  },
  {
    slug: 'products',
    title: 'Products',
    description:
      'Clean light, honest color, built to carry a story on a storefront or feed.',
    heroImageId: 'DSCF0632',
  },
  {
    slug: 'graduation',
    title: 'Graduation',
    description:
      'The walk, the hug, the grin that breaks through the pose. Years of work, caught in an afternoon.',
    heroImageId: 'DSCF9084',
  },
  {
    slug: 'aesthetics',
    title: 'Aesthetics',
    description:
      'Quiet frames — textures, objects, light. Nothing much, on purpose.',
    heroImageId: 'DSCF9541',
  },
];
