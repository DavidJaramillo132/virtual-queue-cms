import { Request , Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { UsuarioRepo } from "../../repository/UsuarioRepo";

const usuarioRepo = new UsuarioRepo();

export class AuthController {
    async login(req: Request, res: Response){
        try{

            const { email, password, rol, telefono, creado_en} = req.body;
            const usuario = await usuarioRepo.getByEmail(email);
            if(!usuario){
                res.status(404).json({ message: 'Usuario no encontrado' });
                return;
            }

            const passwordsMatch = await bcrypt.compare(password, usuario.password);
            if(!passwordsMatch){
                res.status(401).json({ message: 'Contraseña incorrecta' });
                return;
            }

            const token = jwt.sign(
                { id: usuario.id, email: usuario.email, rol: usuario.rol },
                process.env.JWT_SECRET!,
                //{ expiresIn: '1h' }
            );

            res.json({
                message: 'Login exitoso',
                token,
                user: { id: usuario.id, email: usuario.email, rol: usuario.rol }
            });

        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }
}