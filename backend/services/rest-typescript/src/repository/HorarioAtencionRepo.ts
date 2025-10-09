import { AppDataSource } from '../database/database';
import { HorarioAtencion } from '../entities/index';
import { Repository } from 'typeorm';

export class HorarioAtencionRepo {
  private repo: Repository<HorarioAtencion>;

  constructor() {
    this.repo = AppDataSource.getRepository(HorarioAtencion);
  }

  async create(data: Partial<HorarioAtencion>): Promise<HorarioAtencion> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<HorarioAtencion>): Promise<HorarioAtencion | null> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) return null;
    this.repo.merge(entity, data);
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getAll(): Promise<HorarioAtencion[]> {
    return this.repo.find();
  }

  async getById(id: string): Promise<HorarioAtencion | null> {
    return this.repo.findOneBy({ id });
  }
}
