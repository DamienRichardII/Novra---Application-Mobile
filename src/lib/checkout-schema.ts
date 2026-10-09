import { z } from 'zod';
import type { ShippingMethod } from './config';

/** Mêmes limites que le schéma Zod de `create-order` (confort côté app : le serveur reste juge — doc 04/06). */
const required = z.string().trim().min(1, 'Champ obligatoire');

export const contactSchema = z.object({
  firstname: required.max(80),
  lastname: required.max(80),
  email: z.string().trim().min(1, 'Champ obligatoire').email('Adresse e-mail invalide').max(160),
  phone: z
    .string()
    .trim()
    .min(1, 'Champ obligatoire')
    .refine((v) => v.replace(/[\s.\-()]/g, '').replace(/^\+/, '').replace(/\D/g, '').length >= 8, 'Numéro de téléphone invalide'),
});

export const addressSchema = z.object({
  address: required.max(200),
  address2: z.string().trim().max(200).optional(),
  zip: required.max(12),
  city: required.max(100),
  country: z.enum(['FR', 'BE', 'CH', 'LU']),
});

export type ContactForm = z.infer<typeof contactSchema>;
export type AddressForm = z.infer<typeof addressSchema>;

export const needsAddress = (m: ShippingMethod) => m !== 'pickup';

export function fieldErrors(result: { success: boolean; error?: z.ZodError }): Record<string, string> {
  if (result.success || !result.error) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const k = String(issue.path[0] ?? '');
    if (k && !out[k]) out[k] = issue.message;
  }
  return out;
}
