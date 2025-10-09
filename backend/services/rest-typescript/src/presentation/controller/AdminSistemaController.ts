import { Request, Response } from 'express';
import { AdminSistema } from '../../entities/AdminSistema';
import { AdminSistemaRepo } from '../../repository/AdminSistemaRepo';

const adminRepo = new AdminSistemaRepo();

export class AdminSistemaController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: Partial<AdminSistema> = req.body;
      const created = await adminRepo.create(data);
      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating adminSistema:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const items = await adminRepo.getAll();
      res.json(items);
    } catch (error) {
      console.error('Error fetching admins:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const item = await adminRepo.getById(id);
      if (!item) {
        res.status(404).json({ error: 'Admin not found' });
        return;
      }
      res.json(item);
    } catch (error) {
      console.error(`Error fetching admin ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const data: Partial<AdminSistema> = req.body;
      const updated = await adminRepo.update(id, data);
      if (!updated) {
        res.status(404).json({ error: 'Admin not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error(`Error updating admin ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const deleted = await adminRepo.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Admin not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting admin ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
