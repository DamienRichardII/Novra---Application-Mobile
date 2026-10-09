import { config } from './config';

/**
 * Résout un chemin média : URL absolue inchangée, chemin relatif (`assets/web/...`)
 * résolu contre EXPO_PUBLIC_MEDIA_BASE. Point d'entrée unique (doc 05).
 */
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|data:|file:)/i.test(path)) return path;
  const clean = path.replace(/^\.?\/+/, '');
  return config.mediaBase ? `${config.mediaBase}/${clean}` : clean;
}

/** Valeur de point focal 0–100 ; invalide → 50 (jamais NaN) — `cmsSafeFocal` du site. */
export function safeFocal(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 50;
}

export function focalPosition(x: unknown, y: unknown) {
  return { left: `${safeFocal(x)}%`, top: `${safeFocal(y)}%` } as const;
}
