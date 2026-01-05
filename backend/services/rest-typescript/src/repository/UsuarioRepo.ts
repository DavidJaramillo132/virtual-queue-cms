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

  /**
   * Obtiene todos los usuarios premium
   * @returns Array de usuarios con suscripción premium activa
   */
  async getPremium(): Promise<Usuario[]> {
    return this.repo.find({
      where: { es_premium: true },
      order: { creadoEn: 'DESC' }
    });
  }

  /**
   * Actualiza el estado premium de un usuario
   * @param id ID del usuario
   * @param esPremium Nuevo estado premium
   * @returns Usuario actualizado o null
   */
  async actualizarPremium(id: string, esPremium: boolean): Promise<Usuario | null> {
    const usuario = await this.repo.findOneBy({ id });
    if (!usuario) return null;
    
    usuario.es_premium = esPremium;
    return this.repo.save(usuario);
  }

  /**
   * Verifica si un usuario es premium
   * @param id ID del usuario
   * @returns true si el usuario es premium, false si no lo es o no existe
   */
  async esPremium(id: string): Promise<boolean> {
    const usuario = await this.repo.findOneBy({ id });
    return usuario?.es_premium ?? false;
  }
}