import { AppDataSource } from '../database/database';
import { Usuario } from '../entities/index';
import { Repository } from 'typeorm';

export class UsuarioRepo {
    private repo: Repository<Usuario>;

    constructor() {
        this.repo = AppDataSource.getRepository(Usuario);
    }

    async create(usuarioData: Partial<Usuario>): Promise<Usuario> {
        const usuario = this.repo.create(usuarioData);
        return this.repo.save(usuario)
    }

    async update(id: string, usuarioData: Partial<Usuario>): Promise<Usuario | null> {
        const usuario = await this.repo.findOneBy({ id });
        if (!usuario) return null;
        this.repo.merge(usuario, usuarioData);
        return this.repo.save(usuario);
    }

    // Puede que lo mueva a adminSistemaRepo
    async delete(id: string): Promise<boolean> {
        const result = await this.repo.delete(id);
        return (result.affected ?? 0) > 0;
    }

    async getAll(): Promise<Usuario[]> {
        return this.repo.find();
    }

    async getByEmail(email: string): Promise<Usuario | null> {
        return this.repo.findOneBy({ email });
    }
}