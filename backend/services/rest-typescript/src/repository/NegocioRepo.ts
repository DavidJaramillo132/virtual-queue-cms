import { AppDataSource } from '../database/database';
import { Negocio } from '../entities/index';
import { Repository } from 'typeorm';

export class NegocioRepo {
  private repo: Repository<Negocio>;

  constructor() {
    this.repo = AppDataSource.getRepository(Negocio);
  }

  async create(data: Partial<Negocio>): Promise<Negocio> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Negocio>): Promise<Negocio | null> {
    const entity = await this.repo.findOneBy({ id });
    if (!entity) return null;
    this.repo.merge(entity, data);
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getAll(searchQuery?: string): Promise<Negocio[]> {
    if (searchQuery) {
      // Búsqueda por nombre, categoría o correo
      return this.repo
        .createQueryBuilder('negocio')
        .where('negocio.nombre ILIKE :search', { search: `%${searchQuery}%` })
        .orWhere('negocio.categoria ILIKE :search', { search: `%${searchQuery}%` })
        .orWhere('negocio.correo ILIKE :search', { search: `%${searchQuery}%` })
        .getMany();
    }
    return this.repo.find();
  }

  async getById(id: string): Promise<Negocio | null> {
    return this.repo.findOneBy({ id });
  }
}
