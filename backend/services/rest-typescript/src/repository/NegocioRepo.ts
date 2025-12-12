import { Negocio } from '../entities/index';
import { BaseRepository } from './base/BaseRepository';

// NegocioRepo es una extensión de BaseRepository especializada en la entidad Negocio
export class NegocioRepo extends BaseRepository<Negocio> {
  constructor() {
    super(Negocio);
  }

  /**
   * Obtiene todos los negocios, opcionalmente filtrados por búsqueda
   * @param searchQuery Término de búsqueda opcional (busca en nombre, categoría o correo)
   * @returns Array de negocios que coinciden con la búsqueda o todos si no hay búsqueda
   */
  async getAll(searchQuery?: string): Promise<Negocio[]> {
    if (searchQuery) {
      // Búsqueda por nombre, categoría o correo
      return this.repo
        .createQueryBuilder('negocio')
        .where('negocio.nombre ILIKE :search', { search: `%${searchQuery}%` })
        .orWhere('negocio.categoria ILIKE :search', { search: `%${searchQuery}%` })
        .orWhere('negocio.correo ILIKE :search', { search: `%${searchQuery}%` })
        .getMany();
    }
    return this.repo.find();
  }
}
