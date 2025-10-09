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
}
