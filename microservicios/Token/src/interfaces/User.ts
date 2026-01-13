/**
 * Representa un usuario en el sistema de autenticacion
 */
export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}
