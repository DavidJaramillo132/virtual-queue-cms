import { Negocio } from '../entities/index';
import { BaseRepository } from './base/BaseRepository';

// NegocioRepo es una extension de BaseRepository especializada en la entidad Negocio
export class NegocioRepo extends BaseRepository<Negocio> {
  constructor() {
    super(Negocio);
  }

  /**
   * Obtiene todos los negocios, opcionalmente filtrados por busqueda
   * @param searchQuery Termino de busqueda opcional (busca en nombre, categoria o correo)
   * @returns Array de negocios que coinciden con la busqueda o todos si no hay busqueda
   */
  async getAll(searchQuery?: string): Promise<Negocio[]> {
    if (searchQuery) {
      // Busqueda por nombre, categoria o correo
      return this.repo
        .createQueryBuilder('negocio')
        .where('negocio.nombre ILIKE :search', { search: `%${searchQuery}%` })
        .orWhere('negocio.categoria ILIKE :search', { search: `%${searchQuery}%` })
        .orWhere('negocio.correo ILIKE :search', { search: `%${searchQuery}%` })
        .getMany();
    }
    return this.repo.find();
  }

  /**
   * Obtiene todos los negocios activos ordenados por fecha
   * @returns Array de negocios activos
   */
  async getAllActivos(): Promise<Negocio[]> {
    return this.repo
      .createQueryBuilder('negocio')
      .where('negocio.estado = :estado', { estado: true })
      .orderBy('negocio.creadoEn', 'DESC')
      .getMany();
  }
}
