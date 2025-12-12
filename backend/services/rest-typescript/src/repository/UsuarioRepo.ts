import { Usuario } from '../entities/index';
import { BaseRepository } from './base/BaseRepository';

// UsuarioRepo es una extensión de BaseRepository especializada en la entidad Usuario
export class UsuarioRepo extends BaseRepository<Usuario> {
  constructor() {
    super(Usuario);
  }

  async getByEmail(email: string): Promise<Usuario | null> {
    return this.repo.findOne({ 
      where: { email },
      relations: ['negocios']
    });
  }
}