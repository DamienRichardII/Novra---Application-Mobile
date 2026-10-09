import { formatPrice, toCents, formatCents } from '@/lib/money';
import { mediaUrl, safeFocal } from '@/lib/media';
import { mergeLine, priceLines, subtotalCents, cartCount } from '@/lib/cart';
import { estimateShippingCents, remainingForFreeShipping } from '@/lib/shipping';
import { applyFilters, EMPTY_FILTERS, activeFilterCount } from '@/lib/filters';
import { contactSchema, addressSchema, fieldErrors } from '@/lib/checkout-schema';
import { ctaToRoute } from '@/api/cms';
import { bundledCatalogue, isSizeAvailable, isVariantAvailable, relatedProducts, sortSizes } from '@/api/catalogue';
import { nextStatus, priceNeedsConfirm, allowedViews, canEdit } from '@/api/admin';
import { REFERENCE_RE } from '@/api/functions';
import type { Product } from '@/types';

const product = (o: Partial<Product> = {}): Product => ({
  id: 'p', slug: 'p', name: 'Produit', category: 'polos', categoryLabel: 'Polos', gender: 'homme', price: 45.99,
  description: '', images: ['a.jpg'], colors: ['Noir', 'Blanc'], sizes: ['S', 'M'], variants: [], trackInventory: false,
  isNew: false, featured: false, technicalDetails: [], composition: '', care: '', focalX: 50, focalY: 50, ...o,
});

describe('money', () => {
  it('formate comme le site', () => {
    expect(formatPrice(45.99)).toBe('45,99 €');
    expect(formatPrice(80)).toBe('80,00 €');
  });
  it('convertit en centimes sans dérive', () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents('0.1') + toCents('0.2')).toBe(30);
    expect(formatCents(490)).toBe('4,90 €');
  });
});

describe('media', () => {
  it('garde les URLs absolues et résout les chemins relatifs', () => {
    expect(mediaUrl('https://x.supabase.co/a.jpg')).toBe('https://x.supabase.co/a.jpg');
    expect(mediaUrl('assets/web/a.jpg')).toMatch(/\/assets\/web\/a\.jpg$/);
    expect(mediaUrl(null)).toBeUndefined();
  });
  it('point focal invalide → 50', () => {
    expect(safeFocal(undefined)).toBe(50);
    expect(safeFocal('abc')).toBe(50);
    expect(safeFocal(150)).toBe(100);
    expect(safeFocal(-5)).toBe(0);
  });
});

describe('panier', () => {
  it('fusionne les lignes identiques et borne la quantité', () => {
    let l = mergeLine([], { slug: 'a', color: 'Noir', size: 'M', qty: 2 });
    l = mergeLine(l, { slug: 'a', color: 'Noir', size: 'M', qty: 3 });
    expect(l).toEqual([{ slug: 'a', color: 'Noir', size: 'M', qty: 5 }]);
    l = mergeLine(l, { slug: 'a', color: 'Noir', size: 'M', qty: 99 });
    expect(l[0].qty).toBe(20);
    l = mergeLine(l, { slug: 'a', color: 'Blanc', size: 'M', qty: 1 });
    expect(l).toHaveLength(2);
  });
  it('limite à 40 lignes', () => {
    let l: ReturnType<typeof mergeLine> = [];
    for (let i = 0; i < 45; i++) l = mergeLine(l, { slug: `s${i}`, color: 'Noir', size: 'M', qty: 1 });
    expect(l).toHaveLength(40);
  });
  it('relit le prix du catalogue et signale les lignes disparues (R10)', () => {
    const priced = priceLines(
      [{ slug: 'p', color: 'Noir', size: 'M', qty: 2 }, { slug: 'zz', color: 'Noir', size: 'M', qty: 1 }, { slug: 'p', color: 'Noir', size: 'XXL', qty: 1 }],
      [product()],
    );
    expect(priced[0].totalCents).toBe(9198);
    expect(priced[1].issue).toBe('missing');
    expect(priced[2].issue).toBe('size-gone');
    expect(subtotalCents(priced)).toBe(9198 + 4599);
    expect(cartCount([{ slug: 'a', color: 'n', size: 'M', qty: 2 }, { slug: 'b', color: 'n', size: 'M', qty: 3 }])).toBe(5);
  });
});

describe('livraison (R3)', () => {
  it('standard : 4,90 € à 79,99 € puis offerte à 80,00 €', () => {
    expect(estimateShippingCents(7999, 'standard')).toBe(490);
    expect(estimateShippingCents(8000, 'standard')).toBe(0);
  });
  it('express, relais et retrait', () => {
    expect(estimateShippingCents(9000, 'express')).toBe(990);
    expect(estimateShippingCents(9000, 'relay')).toBe(290);
    expect(estimateShippingCents(100, 'pickup')).toBe(0);
  });
  it('reste avant livraison offerte', () => {
    expect(remainingForFreeShipping(5000)).toBe(3000);
    expect(remainingForFreeShipping(9000)).toBe(0);
  });
});

describe('catalogue', () => {
  const all = bundledCatalogue();
  it("l'instantané embarqué contient des produits exploitables", () => {
    expect(all.length).toBeGreaterThan(0);
    for (const p of all) {
      expect(p.slug).toBeTruthy();
      expect(p.price).toBeGreaterThan(0);
      expect(p.images.length).toBeGreaterThan(0);
    }
  });
  it('trie les tailles dans l’ordre métier', () => {
    expect(sortSizes(['XL', 'S', 'XXL', 'M', 'XS', 'L'])).toEqual(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  });
  it('disponibilité : non suivi = vendable ; suivi = stock requis', () => {
    const open = product({ trackInventory: false });
    expect(isSizeAvailable(open, 'M')).toBe(true);
    const tracked = product({ trackInventory: true, variants: [{ color: 'Noir', size: 'M', stock: 3 }, { color: 'Noir', size: 'S', stock: 0 }] });
    expect(isVariantAvailable(tracked, 'Noir', 'M')).toBe(true);
    expect(isVariantAvailable(tracked, 'Noir', 'S')).toBe(false);
    expect(isVariantAvailable(tracked, 'Blanc', 'M')).toBe(false);
  });
  it('produits liés : même catégorie d’abord', () => {
    const a = product({ slug: 'a', category: 'polos' });
    const b = product({ slug: 'b', category: 'vestes' });
    const c = product({ slug: 'c', category: 'polos' });
    expect(relatedProducts([a, b, c], a).map((p) => p.slug)).toEqual(['c', 'b']);
  });
});

describe('filtres et recherche', () => {
  const list = [
    product({ slug: 'a', name: 'Polo Tech', category: 'polos', price: 45 }),
    product({ slug: 'b', name: 'Veste Coupe-vent', category: 'vestes', price: 120, gender: 'femme', isNew: true }),
    product({ slug: 'c', name: 'Casquette', category: 'accessoires', price: 30, gender: 'unisexe', colors: ['Kaki'] }),
  ];
  it('recherche sans accents ni casse', () => {
    expect(applyFilters(list, EMPTY_FILTERS, 'VESTE', 'new').map((p) => p.slug)).toEqual(['b']);
    expect(applyFilters(list, EMPTY_FILTERS, 'kaki', 'new').map((p) => p.slug)).toEqual(['c']);
  });
  it('filtre prix, catégorie, nouveautés et trie', () => {
    expect(applyFilters(list, { ...EMPTY_FILTERS, maxPrice: 50 }, '', 'priceAsc').map((p) => p.slug)).toEqual(['c', 'a']);
    expect(applyFilters(list, { ...EMPTY_FILTERS, category: 'vestes' }, '', 'new')).toHaveLength(1);
    expect(applyFilters(list, { ...EMPTY_FILTERS, newOnly: true }, '', 'new')).toHaveLength(1);
    expect(applyFilters(list, EMPTY_FILTERS, '', 'priceDesc')[0].slug).toBe('b');
    expect(activeFilterCount({ ...EMPTY_FILTERS, maxPrice: 50, inStock: true })).toBe(2);
  });
  it('le genre « femme » inclut les produits unisexes', () => {
    expect(applyFilters(list, { ...EMPTY_FILTERS, gender: 'femme' }, '', 'new').map((p) => p.slug).sort()).toEqual(['b', 'c']);
  });
});

describe('formulaire de commande', () => {
  it('valide les coordonnées', () => {
    const bad = fieldErrors(contactSchema.safeParse({ firstname: '', lastname: 'D', email: 'x', phone: '12' }));
    expect(Object.keys(bad).sort()).toEqual(['email', 'firstname', 'phone']);
    expect(fieldErrors(contactSchema.safeParse({ firstname: 'A', lastname: 'B', email: 'a@b.fr', phone: '06 12 34 56 78' }))).toEqual({});
  });
  it("valide l'adresse", () => {
    expect(Object.keys(fieldErrors(addressSchema.safeParse({ address: '', zip: '', city: '', country: 'FR' }))).sort()).toEqual(['address', 'city', 'zip']);
    expect(fieldErrors(addressSchema.safeParse({ address: '1 rue X', zip: '93600', city: 'Aulnay', country: 'FR' }))).toEqual({});
  });
  it('format de référence', () => {
    expect(REFERENCE_RE.test('NVR-261009-A1B2')).toBe(true);
    expect(REFERENCE_RE.test('NVR-261009')).toBe(false);
  });
});

describe('liens du CMS', () => {
  it('traduit les URLs du site en routes internes', () => {
    expect(ctaToRoute('marketplace.html')).toEqual({ kind: 'route', href: '/shop' });
    expect(ctaToRoute('marketplace.html?category=polos')).toEqual({ kind: 'route', href: '/shop?cat=polos' });
    expect(ctaToRoute('product.html?slug=polo-tech')).toEqual({ kind: 'route', href: '/produit/polo-tech' });
    expect(ctaToRoute('about.html')).toEqual({ kind: 'route', href: '/pages/a-propos' });
    expect(ctaToRoute('https://www.instagram.com/novra_officiel/').kind).toBe('external');
  });
});

describe('admin', () => {
  it('étapes suivantes selon le mode de réception, jamais « payée »', () => {
    expect(nextStatus({ fulfilment: 'delivery', status: 'paid' })).toBe('preparing');
    expect(nextStatus({ fulfilment: 'delivery', status: 'preparing' })).toBe('shipped');
    expect(nextStatus({ fulfilment: 'pickup', status: 'preparing' })).toBe('ready_for_pickup');
    expect(nextStatus({ fulfilment: 'pickup', status: 'ready_for_pickup' })).toBe('picked_up');
    expect(nextStatus({ fulfilment: 'delivery', status: 'pending' })).toBeUndefined();
  });
  it('confirmation de prix au-delà du double ou sous la moitié', () => {
    expect(priceNeedsConfirm(45, 4.5)).toBe(true);
    expect(priceNeedsConfirm(45, 100)).toBe(true);
    expect(priceNeedsConfirm(45, 50)).toBe(false);
  });
  it('rôles (R13) : support en lecture seule, écrans limités', () => {
    expect(canEdit('support')).toBe(false);
    expect(canEdit('manager')).toBe(true);
    expect(allowedViews('support')).toEqual(['dashboard', 'commandes']);
    expect(allowedViews('super_admin')).toHaveLength(4);
  });
});
