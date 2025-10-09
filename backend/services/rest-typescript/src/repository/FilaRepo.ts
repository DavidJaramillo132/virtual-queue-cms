import { AppDataSource } from '../database/database';
import { Fila } from '../entities/index';
import { Repository } from 'typeorm';

export class FilaRepo {
  private repo: Repository<Fila>;

  constructor() {
    this.repo = AppDataSource.getRepository(Fila);
  }

  async create(data: Partial<Fila>): Promise<Fila> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Fila>): Promise<Fila | null> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) return null;
    this.repo.merge(entity, data);
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getAll(): Promise<Fila[]> {
    return this.repo.find();
  }

  async getById(id: string): Promise<Fila | null> {
    return this.repo.findOneBy({ id });
  }
}
