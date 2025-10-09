import { Request, Response } from 'express';
import { HorarioAtencion } from '../../entities/HorarioAtencion';
import { HorarioAtencionRepo } from '../../repository/HorarioAtencionRepo';

const horarioRepo = new HorarioAtencionRepo();

export class HorarioAtencionController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: Partial<HorarioAtencion> = req.body;
      const created = await horarioRepo.create(data);
      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating horario:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const items = await horarioRepo.getAll();
      res.json(items);
    } catch (error) {
      console.error('Error fetching horarios:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const item = await horarioRepo.getById(id);
      if (!item) {
        res.status(404).json({ error: 'Horario not found' });
        return;
      }
      res.json(item);
    } catch (error) {
      console.error(`Error fetching horario ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const data: Partial<HorarioAtencion> = req.body;
      const updated = await horarioRepo.update(id, data);
      if (!updated) {
        res.status(404).json({ error: 'Horario not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error(`Error updating horario ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const deleted = await horarioRepo.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Horario not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting horario ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
