import { AppDataSource } from '../database/database';
import { Servicio } from '../entities/index';
import { Repository } from 'typeorm';

export class ServicioRepo {
  private repo: Repository<Servicio>;

  constructor() {
    this.repo = AppDataSource.getRepository(Servicio);
  }

  async create(data: Partial<Servicio>): Promise<Servicio> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Servicio>): Promise<Servicio | null> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) return null;
    this.repo.merge(entity, data);
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getAll(): Promise<Servicio[]> {
    return this.repo.find();
  }

  async getById(id: string): Promise<Servicio | null> {
    return this.repo.findOneBy({ id });
  }
}
