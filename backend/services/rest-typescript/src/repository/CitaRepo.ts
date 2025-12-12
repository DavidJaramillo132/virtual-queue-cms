import { Cita } from '../entities/index';
import { BaseRepository } from './base/BaseRepository';

// CitaRepo es una extensión de BaseRepository especializada en la entidad Cita
export class CitaRepo extends BaseRepository<Cita> {
  constructor() {
    super(Cita);
  }

  async getByNegocioId(negocio_id: string): Promise<Cita[]> {
    return this.repo.find({ 
      where: { negocio_id },
      order: { fecha: 'ASC', hora_inicio: 'ASC' }
    });
  }

  async getByEstacionId(estacion_id: string): Promise<Cita[]> {
    return this.repo.find({ 
      where: { estacion_id },
      order: { fecha: 'ASC', hora_inicio: 'ASC' }
    });
  }


  async getByClienteId(cliente_id: string): Promise<Cita[]> {
    return this.repo.find({ 
      where: { cliente_id },
      order: { fecha: 'DESC', hora_inicio: 'DESC' }
    });
  }
}
