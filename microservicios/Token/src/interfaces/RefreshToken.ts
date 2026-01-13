/**
 * Registro de refresh token almacenado en la base de datos
 */
export interface RefreshTokenRecord {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  revoked: number;  // 0 = activo, 1 = revocado
  created_at: string;
}
