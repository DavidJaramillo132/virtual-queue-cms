import { Request, Response } from "express";
import { Usuario } from "../../entities/Usuario";
import { UsuarioRepo } from "../../repository/UsuarioRepo";

const usuarioRepo = new UsuarioRepo();

export class UsuarioController {
    async createUsuario(req: Request, res: Response): Promise<void>{
        try {
            const usuarioData: Partial<Usuario> = req.body;
            const newUsuario = await usuarioRepo.create(usuarioData);
            res.status(201).json(newUsuario);
        } catch (error) {
            console.error("Error creating usuario:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getAllUsuarios(req: Request, res: Response): Promise<void> {
        try {
            const usuarios = await usuarioRepo.getAll();
            res.json(usuarios);
        } catch (error) {
            console.error("Error fetching usuarios:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getUsuarioById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        try {
            const usuario = await usuarioRepo.getById(id);
            if (!usuario) {
                res.status(404).json({ error: "Usuario not found" });
                return;
            }
            res.json(usuario);
        } catch (error) {
            console.error(`Error fetching usuario ${id}:`, error);
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
}