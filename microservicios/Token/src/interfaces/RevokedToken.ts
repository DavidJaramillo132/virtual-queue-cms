/**
 * Registro de access token revocado (blacklist)
 */
export interface RevokedTokenRecord {
  id: string;
  jti: string;  // JWT ID del token revocado
  created_at: string;
}
