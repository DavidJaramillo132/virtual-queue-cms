import { Request , Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { UsuarioRepo } from "../../repository/UsuarioRepo";

const usuarioRepo = new UsuarioRepo();

export class AuthController {
    async login(req: Request, res: Response){
        try{
            console.log('Request body recibido en login:', req.body);
            // Solo necesitamos email y password para login
            const { email, password } = req.body;
            
            // Validación de campos requeridos
            if (!email || !password) {
                res.status(400).json({ message: 'Email y contraseña son requeridos' });
                return;
            }

            const usuario = await usuarioRepo.getByEmail(email);
            console.log('Usuario encontrado:', usuario);
            if(!usuario){
                res.status(404).json({ message: 'Usuario no encontrado' });
                return;
            }

            const passwordsMatch = await bcrypt.compare(password, usuario.password);
            if(!passwordsMatch){
                res.status(401).json({ message: 'Contraseña incorrecta' });
                return;
            }

            // Token con expiración de 24 horas
            const token = jwt.sign(
                { id: usuario.id, email: usuario.email },
                process.env.JWT_SECRET!,
                { expiresIn: '24h' }, 
            );

            res.json({
                successful: true,
                message: 'Login exitoso',
                token,
                user: { 
                    id: usuario.id, 
                    email: usuario.email, 
                    rol: usuario.rol,
                    nombre_completo: usuario.nombre_completo,
                    telefono: usuario.telefono
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }
}