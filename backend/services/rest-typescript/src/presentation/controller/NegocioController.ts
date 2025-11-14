import { Request, Response } from 'express';
import { Negocio } from '../../entities/Negocio';
import { NegocioRepo } from '../../repository/NegocioRepo';

const negocioRepo = new NegocioRepo();

export class NegocioController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: Partial<Negocio> = req.body;
      const created = await negocioRepo.create(data);
      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating negocio:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search } = req.query;
      const searchQuery = search && typeof search === 'string' ? search : undefined;
      const items = await negocioRepo.getAll(searchQuery);
      res.json(items);
    } catch (error) {
      console.error('Error fetching negocios:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const item = await negocioRepo.getById(id);
      if (!item) {
        res.status(404).json({ error: 'Negocio not found' });
        return;
      }
      res.json(item);
    } catch (error) {
      console.error(`Error fetching negocio ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const data: Partial<Negocio> = req.body;
      const updated = await negocioRepo.update(id, data);
      if (!updated) {
        res.status(404).json({ error: 'Negocio not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error(`Error updating negocio ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const deleted = await negocioRepo.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Negocio not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting negocio ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
