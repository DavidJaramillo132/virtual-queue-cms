import { Request, Response } from 'express';
import { Servicio } from '../../entities/Servicio';
import { ServicioRepo } from '../../repository/ServicioRepo';

const servicioRepo = new ServicioRepo();

export class ServicioController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: Partial<Servicio> = req.body;
      const created = await servicioRepo.create(data);
      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating servicio:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { negocio_id } = req.query;
      
      // Si se proporciona negocio_id, filtrar por ese negocio
      if (negocio_id && typeof negocio_id === 'string') {
        const items = await servicioRepo.getByNegocioId(negocio_id);
        res.json(items);
        return;
      }
      
      // Si no, devolver todos
      const items = await servicioRepo.getAll();
      res.json(items);
    } catch (error) {
      console.error('Error fetching servicios:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const item = await servicioRepo.getById(id);
      if (!item) {
        res.status(404).json({ error: 'Servicio not found' });
        return;
      }
      res.json(item);
    } catch (error) {
      console.error(`Error fetching servicio ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const data: Partial<Servicio> = req.body;
      const updated = await servicioRepo.update(id, data);
      if (!updated) {
        res.status(404).json({ error: 'Servicio not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error(`Error updating servicio ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const deleted = await servicioRepo.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Servicio not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting servicio ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
