import { Servicio } from '../entities/index';
import { BaseRepository } from './base/BaseRepository';

// ServicioRepo es una extensión de BaseRepository especializada en la entidad Servicio
export class ServicioRepo extends BaseRepository<Servicio> {
  constructor() {
    super(Servicio);
  }


  async getByNegocioId(negocio_id: string): Promise<Servicio[]> {
    return this.repo.find({
      where: { negocio_id }
    });
  }
}
