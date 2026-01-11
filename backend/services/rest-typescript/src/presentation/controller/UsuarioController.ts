import { Request, Response } from "express";
import bcrypt from "bcrypt";
import axios from 'axios';
import { Usuario } from "../../entities/Usuario";
import { UsuarioRepo } from "../../repository/UsuarioRepo";

const usuarioRepo = new UsuarioRepo();

export class UsuarioController {
    async createUsuario(req: Request, res: Response): Promise<void>{
        try {
            const { nombre_completo, email, password, rol, telefono } = req.body;

            // Validación de campos requeridos
            if (!nombre_completo || !email || !password || !rol) {
                res.status(400).json({ 
                    message: 'Todos los campos son requeridos: nombre_completo, email, password, rol' 
                });
                return;
            }

            // Verificar si el email ya existe en repositorio local
            const existingUsuario = await usuarioRepo.getByEmail(email);
            if (existingUsuario) {
                res.status(409).json({ message: 'El email ya está registrado' });
                return;
            }

            // Registrar en Auth microservicio primero para mantener consistencia
            const tokenServiceUrl = process.env.TOKEN_SERVICE_URL || 'http://token-service:4000';
            try {
                await axios.post(`${tokenServiceUrl}/auth/register`, { email, password });
            } catch (err: any) {
                // si ya existe en token service, permitir continuar; si hay otro error, abortar
                if (err.response && err.response.status === 409) {
                    // usuario ya existe en auth service, continuamos
                } else {
                    console.error('Error registering user in token service', err.response?.data || err.message || err);
                    res.status(502).json({ message: 'Error registrando en el servicio de autenticación' });
                    return;
                }
            }

            // Encriptar contraseña localmente para almacenarla en la DB del REST
            const hashedPassword = await bcrypt.hash(password, 10);

            // Crear usuario con contraseña encriptada
            const usuarioData: Partial<Usuario> = {
                nombre_completo,
                email,
                password: hashedPassword,
                rol,
                telefono
            };

            const newUsuario = await usuarioRepo.create(usuarioData);
            
            // No devolver la contraseña en la respuesta
            const { password: _, ...usuarioSinPassword } = newUsuario;
            
            res.status(201).json({
                message: 'Usuario registrado exitosamente',
                user: usuarioSinPassword
            });
        } catch (error) {
            console.error("Error creating usuario:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    }

    async getAllUsuarios(req: Request, res: Response): Promise<void> {
        try {
            const { rol } = req.query;
            let usuarios = await usuarioRepo.getAll();
            
            // Filtrar por rol si se proporciona
            if (rol && typeof rol === 'string') {
                const rolLower = rol.toLowerCase();
                // Mapear roles del frontend a roles del backend
                let rolBackend: string | null = null;
                if (rolLower === 'admin sistema') {
                    rolBackend = 'admin_sistema';
                } else if (rolLower === 'admin local') {
                    rolBackend = 'negocio'; // En el backend, admin local es 'negocio'
                } else if (rolLower === 'cliente') {
                    rolBackend = 'cliente';
                }
                
                if (rolBackend) {
                    usuarios = usuarios.filter(u => u.rol === rolBackend);
                }
            }
            
            res.json(usuarios);
        } catch (error) {
            console.error("Error fetching usuarios:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getUsuarioByEmail(req: Request, res: Response): Promise<void> {
        const { email } = req.params;
        try {
            console.log("DSADASASASADADDASD");
            const usuario = await usuarioRepo.getByEmail(email);
            if (!usuario) {
                res.status(404).json({ error: "Usuario not found" });
                return;
            }
            res.json(usuario);
        } catch (error) {
            console.error(`Error fetching usuario ${email}:`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateUsuario(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        try {
            const usuarioData: Partial<Usuario> = req.body;
            const updated = await usuarioRepo.update(id, usuarioData);
            if (!updated) {
                res.status(404).json({ error: "Usuario not found" });
                return;
            }
            res.json(updated);
        } catch (error) {
            console.error(`Error updating usuario ${id}:`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    

    async deleteUsuario(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        try {
            const deleted = await usuarioRepo.delete(id);
            if (!deleted) {
                res.status(404).json({ error: "Usuario not found" });
                return;
            }
            // No content on successful delete
            res.status(204).send();
        } catch (error) {
            console.error(`Error deleting usuario ${id}:`, error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    /**
     * Obtiene todos los usuarios premium
     */
    async getPremium(req: Request, res: Response): Promise<void> {
        try {
            const usuarios = await usuarioRepo.getPremium();
            res.json(usuarios);
        } catch (error) {
            console.error('Error fetching premium usuarios:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Actualiza el estado premium de un usuario
     * Llamado desde el microservicio de pagos
     */
    async updatePremium(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { es_premium } = req.body;

        if (typeof es_premium !== 'boolean') {
            res.status(400).json({ error: 'es_premium debe ser un booleano' });
            return;
        }

        try {
            const updated = await usuarioRepo.actualizarPremium(id, es_premium);
            if (!updated) {
                res.status(404).json({ error: 'Usuario not found' });
                return;
            }
            res.json(updated);
        } catch (error) {
            console.error(`Error updating premium status for usuario ${id}:`, error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    /**
     * Verifica si un usuario es premium
     */
    async checkPremium(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        try {
            const esPremium = await usuarioRepo.esPremium(id);
            res.json({ usuario_id: id, es_premium: esPremium });
        } catch (error) {
            console.error(`Error checking premium status for usuario ${id}:`, error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}