import { Repository, ObjectLiteral, EntityTarget, DeepPartial } from 'typeorm';
import { AppDataSource } from '../../database/database';
import { IRepository } from '../interfaces/IRepository';

/**
 * Clase base abstracta que implementa operaciones CRUD comunes
 * Utiliza genéricos para trabajar con cualquier entidad de TypeORM
 */
export abstract class BaseRepository<T extends ObjectLiteral> implements IRepository<T> {
  protected repo: Repository<T>;

  /**
   * Constructor que inicializa el repositorio de TypeORM para la entidad especificada
   * @param entity Clase de la entidad (ej: Usuario, Cita, etc.)
   */
  constructor(entity: EntityTarget<T>) {
    this.repo = AppDataSource.getRepository(entity);
  }

  /**
   * Crea una nueva entidad en la base de datos
   * @param data Datos parciales de la entidad
   * @returns La entidad creada
   */
  async create(data: Partial<T>): Promise<T> {
    const entity = this.repo.create(data as DeepPartial<T>);
    return this.repo.save(entity);
  }

  /**
   * Actualiza una entidad existente
   * @param id ID de la entidad a actualizar
   * @param data Datos parciales a actualizar
   * @returns La entidad actualizada o null si no existe
   */
  async update(id: string, data: Partial<T>): Promise<T | null> {
    const entity = await this.repo.findOneBy({ id } as any);
    if (!entity) return null;
    this.repo.merge(entity, data as DeepPartial<T>);
    return this.repo.save(entity);
  }

  /**
   * Elimina una entidad de la base de datos
   * @param id ID de la entidad a eliminar
   * @returns true si se eliminó correctamente, false en caso contrario
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Obtiene todas las entidades
   * @returns Array con todas las entidades
   */
  async getAll(): Promise<T[]> {
    return this.repo.find();
  }

  /**
   * Obtiene una entidad por su ID
   * @param id ID de la entidad
   * @returns La entidad encontrada o null si no existe
   */
  async getById(id: string): Promise<T | null> {
    return this.repo.findOneBy({ id } as any);
  }
}

