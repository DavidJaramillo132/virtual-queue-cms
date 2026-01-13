import { JwtPayload } from 'jsonwebtoken';

/**
 * Payload para generar un nuevo token JWT
 */
export interface TokenPayload {
  id: string;
  email: string;
  jti?: string;
}

/**
 * Token JWT decodificado con todos los campos
 */
export interface DecodedToken extends JwtPayload {
  id: string;
  email: string;
  jti: string;
}
