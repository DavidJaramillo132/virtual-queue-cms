import { HorarioAtencion } from '../entities/index';
import { BaseRepository } from './base/BaseRepository';

// HorarioAtencionRepo es una extensión de BaseRepository especializada en la entidad HorarioAtencion
export class HorarioAtencionRepo extends BaseRepository<HorarioAtencion> {
  constructor() {
    super(HorarioAtencion);
  }


  async getByEstacionId(estacionId: string): Promise<HorarioAtencion[]> {
    return this.repo.find({ where: { estacion_id: estacionId } });
  }
}
