import { Request , Response } from "express";
import axios from 'axios';
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
            console.log('Usuario encontrado:', usuario ? 'Sí' : 'No');
            if(!usuario){
                res.status(404).json({ message: 'Usuario no encontrado' });
                return;
            }
            const passwordsMatch = await bcrypt.compare(password, usuario.password);
            if(!passwordsMatch){
                res.status(401).json({ message: 'Contraseña incorrecta' });
                return;
            }

            // Solicitar al microservicio Token: asegurar usuario y solicitar login para obtener access+refresh
            const tokenServiceUrl = process.env.TOKEN_SERVICE_URL || 'http://token-service:4000';
            let tokenResp;
            try {
                // Intentar registrar en token service con el mismo ID de PostgreSQL
                // Si ya existe responde 409 y lo ignoramos
                await axios.post(`${tokenServiceUrl}/auth/register`, { 
                    id: usuario.id,  // Sincronizar ID con la BD principal
                    email: usuario.email, 
                    password 
                });
            } catch (err: any) {
                // 409 -> usuario ya existe en token service
                if (!(err.response && err.response.status === 409)) {
                    console.warn('Warning registering user in token service:', err.message || err);
                }
            }

            try {
                tokenResp = await axios.post(`${tokenServiceUrl}/auth/login`, { email: usuario.email, password });
            } catch (err: any) {
                console.error('Error logging in to token service', err.response?.data || err.message || err);
                return res.status(500).json({ message: 'Error autenticando en token service' });
            }

            const token = tokenResp.data?.accessToken;
            const refreshToken = tokenResp.data?.refreshToken;

            // Obtener negocio_id si el usuario es de tipo negocio
            let negocio_id = null;
            if (usuario.rol === 'negocio' && usuario.negocios && usuario.negocios.length > 0) {
                negocio_id = usuario.negocios[0].id;
            }

            // Obtener fecha de creación (TypeORM puede devolverla como creadoEn o como objeto Date)
            const fechaCreacion = usuario.creadoEn || (usuario as any).creado_en || new Date();

            res.json({
                successful: true,
                message: 'Login exitoso',
                token,
                refreshToken,
                user: { 
                    id: usuario.id, 
                    email: usuario.email, 
                    rol: usuario.rol,
                    nombre_completo: usuario.nombre_completo,
                    nombreCompleto: usuario.nombre_completo, // Mantener compatibilidad
                    telefono: usuario.telefono,
                    negocio_id: negocio_id,
                    es_premium: usuario.es_premium || false,
                    creadoEn: fechaCreacion instanceof Date ? fechaCreacion.toISOString() : fechaCreacion,
                    creado_en: fechaCreacion instanceof Date ? fechaCreacion.toISOString() : fechaCreacion
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }

    async refresh(req: Request, res: Response){
        try{
            const { refreshToken } = req.body;
            if (!refreshToken) return res.status(400).json({ message: 'refreshToken es requerido' });
            const tokenServiceUrl = process.env.TOKEN_SERVICE_URL || 'http://token-service:4000';
            try{
                const resp = await axios.post(`${tokenServiceUrl}/auth/refresh`, { refreshToken });
                return res.json(resp.data);
            } catch(err: any){
                console.error('Error refreshing token at token service', err.response?.data || err.message || err);
                const status = err.response?.status || 500;
                return res.status(status).json(err.response?.data || { message: 'Error refreshing token' });
            }
        } catch (error) {
            console.error('Error en refresh:', error);
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }

    async logout(req: Request, res: Response){
        try{
            const { refreshToken, accessToken } = req.body;
            if (!refreshToken && !accessToken) return res.status(400).json({ message: 'refreshToken o accessToken requerido' });
            const tokenServiceUrl = process.env.TOKEN_SERVICE_URL || 'http://token-service:4000';
            try{
                const resp = await axios.post(`${tokenServiceUrl}/auth/logout`, { refreshToken, accessToken });
                return res.json(resp.data);
            } catch(err: any){
                console.error('Error logging out at token service', err.response?.data || err.message || err);
                const status = err.response?.status || 500;
                return res.status(status).json(err.response?.data || { message: 'Error logout' });
            }
        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }
}