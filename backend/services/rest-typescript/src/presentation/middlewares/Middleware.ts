import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Extender la interfaz Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Extraer el token del header Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  // Verificar formato: "Bearer TOKEN"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Formato de token inválido' });
  }

  const token = parts[1];

  try {
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Guardar info del usuario en req para usarla en los controladores
    req.user = decoded;

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token inválido' });
    }
    return res.status(500).json({ message: 'Error al verificar token' });
  }
};
