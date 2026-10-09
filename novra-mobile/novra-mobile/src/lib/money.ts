/** Affichage identique au site : `45,99 €`. Le serveur décide des montants (règle d'or). */
export const formatPrice = (n: number): string => n.toFixed(2).replace('.', ',') + ' €';

/** Euros (numeric de l'API) → centimes entiers, sans dérive de flottant. */
export const toCents = (euros: number | string): number => Math.round(Number(euros) * 100);

export const formatCents = (cents: number): string => formatPrice(cents / 100);
