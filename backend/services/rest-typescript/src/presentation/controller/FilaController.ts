import { Request, Response } from 'express';
import { Fila } from '../../entities/Fila';
import { FilaRepo } from '../../repository/FilaRepo';

const filaRepo = new FilaRepo();

export class FilaController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: Partial<Fila> = req.body;
      const created = await filaRepo.create(data);
      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating fila:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const items = await filaRepo.getAll();
      res.json(items);
    } catch (error) {
      console.error('Error fetching filas:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const item = await filaRepo.getById(id);
      if (!item) {
        res.status(404).json({ error: 'Fila not found' });
        return;
      }
      res.json(item);
    } catch (error) {
      console.error(`Error fetching fila ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const data: Partial<Fila> = req.body;
      const updated = await filaRepo.update(id, data);
      if (!updated) {
        res.status(404).json({ error: 'Fila not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error(`Error updating fila ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const deleted = await filaRepo.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Fila not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting fila ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
