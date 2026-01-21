// interfaz genérica para el repositorio y contrato de métodos CRUD
export interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
}