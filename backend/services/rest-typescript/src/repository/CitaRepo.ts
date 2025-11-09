import { AppDataSource } from '../database/database';
import { Cita } from '../entities/index';
import { Repository } from 'typeorm';

export class CitaRepo {
  private repo: Repository<Cita>;

  constructor() {
    this.repo = AppDataSource.getRepository(Cita);
  }

  async create(data: Partial<Cita>): Promise<Cita> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Cita>): Promise<Cita | null> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) return null;
    this.repo.merge(entity, data);
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getAll(): Promise<Cita[]> {
    return this.repo.find();
  }

  async getById(id: string): Promise<Cita | null> {
    return this.repo.findOneBy({ id });
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
