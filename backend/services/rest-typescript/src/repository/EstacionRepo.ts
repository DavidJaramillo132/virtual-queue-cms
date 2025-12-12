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
}
