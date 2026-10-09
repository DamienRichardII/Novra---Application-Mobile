/** Erreur dont le message est destiné au client (déjà rédigé en français côté serveur). */
export class UserFacingError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'UserFacingError';
    this.code = code;
    this.status = status;
  }
}

export const isUserFacing = (e: unknown): e is UserFacingError => e instanceof UserFacingError;
