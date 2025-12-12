import { AdminSistema } from '../entities/index';
import { BaseRepository } from './base/BaseRepository';

// AdminSistemaRepo es una extensión de BaseRepository especializada en la entidad AdminSistema
export class AdminSistemaRepo extends BaseRepository<AdminSistema> {
  constructor() {
    super(AdminSistema);
  }
}

