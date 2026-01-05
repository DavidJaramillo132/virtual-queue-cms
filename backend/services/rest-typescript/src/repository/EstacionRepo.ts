import { Estacion } from '../entities/index';
import { BaseRepository } from './base/BaseRepository';

// EstacionRepo es una extensión de BaseRepository especializada en la entidad Estacion
export class EstacionRepo extends BaseRepository<Estacion> {
  constructor() {
    super(Estacion);
  }

  async getByNegocioId(negocio_id: string): Promise<Estacion[]> {
    return this.repo.find({
      where: { negocio_id },
      order: { nombre: 'ASC' }
    });
  }

  /**
   * Obtiene estaciones premium de un negocio
   */
  async getPremiumByNegocioId(negocio_id: string): Promise<Estacion[]> {
    return this.repo.find({
      where: { negocio_id, solo_premium: true, estado: 'activa' },
      order: { nombre: 'ASC' }
    });
  }

  /**
   * Obtiene estaciones normales (no premium) de un negocio
   */
  async getNormalesByNegocioId(negocio_id: string): Promise<Estacion[]> {
    return this.repo.find({
      where: { negocio_id, solo_premium: false, estado: 'activa' },
      order: { nombre: 'ASC' }
    });
  }

  /**
   * Actualiza el estado premium de una estación
   */
  async actualizarSoloPremium(id: string, soloPremium: boolean): Promise<Estacion | null> {
    const estacion = await this.repo.findOneBy({ id });
    if (!estacion) return null;
    
    estacion.solo_premium = soloPremium;
    return this.repo.save(estacion);
  }
}
