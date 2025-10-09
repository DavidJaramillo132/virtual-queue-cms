import { AppDataSource } from '../database/database';
import { AdminSistema } from '../entities/index';
import { Repository } from 'typeorm';

export class AdminSistemaRepo {
	private repo: Repository<AdminSistema>;

	constructor() {
		this.repo = AppDataSource.getRepository(AdminSistema);
	}

	async create(data: Partial<AdminSistema>): Promise<AdminSistema> {
		const entity = this.repo.create(data);
		return this.repo.save(entity);
	}

	async update(id: string, data: Partial<AdminSistema>): Promise<AdminSistema | null> {
		const entity = await this.repo.findOneBy({ id });
		if (!entity) return null;
		this.repo.merge(entity, data);
		return this.repo.save(entity);
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.repo.delete(id);
		return (result.affected ?? 0) > 0;
	}

	async getAll(): Promise<AdminSistema[]> {
		return this.repo.find();
	}

	async getById(id: string): Promise<AdminSistema | null> {
		return this.repo.findOneBy({ id });
	}
}

