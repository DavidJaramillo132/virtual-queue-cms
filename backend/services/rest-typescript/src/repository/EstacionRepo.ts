import { AppDataSource } from '../database/database';
import { Estacion } from '../entities/index';
import { Repository } from 'typeorm';

export class EstacionRepo {
  private repo: Repository<Estacion>;

  constructor() {
    this.repo = AppDataSource.getRepository(Estacion);
  }

  async create(data: Partial<Estacion>): Promise<Estacion> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Estacion>): Promise<Estacion | null> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) return null;
    this.repo.merge(entity, data);
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getAll(): Promise<Estacion[]> {
    return this.repo.find();
  }

  async getById(id: string): Promise<Estacion | null> {
    return this.repo.findOneBy({ id });
  }

  async getByNegocioId(negocio_id: string): Promise<Estacion[]> {
    return this.repo.find({
      where: { negocio_id },
      order: { nombre: 'ASC' }
    });
  }
}
