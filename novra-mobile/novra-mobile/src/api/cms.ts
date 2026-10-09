import { getSupabase } from './supabase';
import { mediaUrl, safeFocal } from '@/lib/media';
import { HERO_POSTER_PATH } from '@/lib/config';

export type CmsMedia = {
  type: string;
  uri?: string;
  poster?: string;
  alt: string;
  focalX: number;
  focalY: number;
};

export type CmsSection = {
  key: string;
  type: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  cta?: { label: string; url: string; blank: boolean };
  media: CmsMedia[];
};

type RawMedia = {
  media_type: string;
  desktop_url: string | null;
  mobile_url: string | null;
  poster_desktop_url: string | null;
  poster_mobile_url: string | null;
  alt_text: string | null;
  focal_x_mobile: number | null;
  focal_y_mobile: number | null;
  sort_order: number | null;
  active: boolean | null;
};
type RawSection = {
  section_key: string;
  section_type: string;
  status: string;
  sort_order: number | null;
  eyebrow: string | null;
  title: string | null;
  description: string | null;
  cta1_label: string | null;
  cta1_url: string | null;
  cta1_blank: boolean | null;
  section_media: RawMedia[] | null;
};

const SELECT =
  'page_key,page_sections(section_key,section_type,status,sort_order,eyebrow,title,subtitle,description,caption,cta1_label,cta1_url,cta1_blank,section_media(media_type,desktop_url,mobile_url,poster_desktop_url,poster_mobile_url,alt_text,caption,focal_x_mobile,focal_y_mobile,sort_order,active))';

/** Accueil embarqué minimal : affiché si la base est injoignable, lente ou vide (doc 09). */
export const FALLBACK_HOME: CmsSection[] = [
  { key: 'hero', type: 'video', media: [{ type: 'image', poster: mediaUrl(HERO_POSTER_PATH), alt: 'Film de marque NOVRA', focalX: 50, focalY: 32 }] },
  { key: 'marque', type: 'editorial', media: [{ type: 'image', uri: mediaUrl('assets/web/vitrine/4o8a0049.jpg'), alt: 'Athlète NOVRA en t-shirt technique gris', focalX: 50, focalY: 50 }] },
  {
    key: 'categories',
    type: 'grid',
    eyebrow: 'Nos essentiels',
    title: 'Par catégorie',
    media: [
      ['T-shirts', 'assets/web/tshirt-noir/dsc02335.jpg'],
      ['Polos', 'assets/web/polo/dsc02307.jpg'],
      ['Ensembles', 'assets/web/ensemble-menthe/dsc02317.jpg'],
      ['Pantalons', 'assets/web/pantalon/dsc02384.jpg'],
      ['Vestes', 'assets/web/veste-noir/dsc02364.jpg'],
      ['Accessoires', 'assets/web/casquette/dsc02336.jpg'],
    ].map(([alt, p]) => ({ type: 'image', uri: mediaUrl(p), alt, focalX: 50, focalY: 50 })),
  },
  { key: 'mission', type: 'editorial', media: [{ type: 'image', uri: mediaUrl('assets/web/vitrine/4o8a0158.jpg'), alt: 'Athlète NOVRA en veste coupe-vent noire', focalX: 50, focalY: 50 }] },
  {
    key: 'communaute',
    type: 'grid',
    media: ['foot-enfant', 'bob-veste', 'tshirt-menthe', 'veste-rouge', 'tshirt-jaune', 'veste-noir-fille', 'casquette-orange'].map((n) => ({
      type: 'image',
      uri: mediaUrl(`assets/web/communaute/communaute-${n}.jpg`),
      alt: `Communauté NOVRA — ${n.replace(/-/g, ' ')}`,
      focalX: 50,
      focalY: 50,
    })),
  },
];

function mapSection(s: RawSection): CmsSection {
  const media = (s.section_media ?? [])
    .filter((m) => m.active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map<CmsMedia>((m) => ({
      type: m.media_type,
      // Mobile d'abord : mobile_url sinon desktop_url (doc 09).
      uri: mediaUrl(m.mobile_url || m.desktop_url),
      poster: mediaUrl(m.poster_mobile_url || m.poster_desktop_url),
      alt: m.alt_text ?? '',
      focalX: safeFocal(m.focal_x_mobile),
      focalY: safeFocal(m.focal_y_mobile),
    }));
  return {
    key: s.section_key,
    type: s.section_type,
    eyebrow: s.eyebrow ?? undefined,
    title: s.title ?? undefined,
    description: s.description ?? undefined,
    cta: s.cta1_label && s.cta1_url ? { label: s.cta1_label, url: s.cta1_url, blank: !!s.cta1_blank } : undefined,
    media,
  };
}

export async function fetchHomeSections(): Promise<{ sections: CmsSection[]; live: boolean }> {
  try {
    const { data, error } = await getSupabase().from('pages').select(SELECT).eq('page_key', 'home').maybeSingle();
    if (error) throw error;
    const raw = ((data as { page_sections?: RawSection[] } | null)?.page_sections ?? []).filter((s) => s.status === 'published');
    if (!raw.length) throw new Error('Accueil vide');
    raw.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    return { sections: raw.map(mapSection), live: true };
  } catch {
    return { sections: FALLBACK_HOME, live: false };
  }
}

/** Traduit une URL de CTA du site vers une route interne de l'app (doc 09). */
export function ctaToRoute(url: string): { kind: 'route'; href: string } | { kind: 'external'; href: string } {
  if (/^https?:\/\//i.test(url)) return { kind: 'external', href: url };
  const u = url.replace(/^\/+/, '');
  const [file, query = ''] = u.split('?');
  const params = new URLSearchParams(query);
  if (file === 'marketplace.html') {
    const cat = params.get('category');
    const gender = params.get('gender');
    const q = [cat ? `cat=${cat}` : '', gender ? `gender=${gender}` : ''].filter(Boolean).join('&');
    return { kind: 'route', href: `/shop${q ? `?${q}` : ''}` };
  }
  if (file === 'product.html') {
    const slug = params.get('slug') || params.get('id');
    return slug ? { kind: 'route', href: `/produit/${slug}` } : { kind: 'route', href: '/shop' };
  }
  if (file === 'about.html') return { kind: 'route', href: '/pages/a-propos' };
  if (file === 'contact.html') return { kind: 'route', href: '/pages/contact' };
  if (file === 'suivi.html') return { kind: 'route', href: '/commandes' };
  return { kind: 'route', href: '/' };
}
