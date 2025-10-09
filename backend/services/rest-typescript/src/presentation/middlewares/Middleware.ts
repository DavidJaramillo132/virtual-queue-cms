import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token: string | undefined = req.headers.authorization?.split(' ')[1];


  if (!token) return res.status(401).json({ message: 'Token no proporcionado' });


  try {
    // Decodifica y verifica el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Guardar info del usuario en req
    (req as any).user = decoded;

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado' });
    }
    return res.status(401).json({ message: 'Token inválido' });
  }
};
