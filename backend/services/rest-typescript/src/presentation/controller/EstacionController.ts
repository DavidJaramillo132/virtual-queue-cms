import { Request, Response } from 'express';
import { Estacion } from '../../entities/Estacion';
import { EstacionRepo } from '../../repository/EstacionRepo';

const estacionRepo = new EstacionRepo();

export class EstacionController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: Partial<Estacion> = req.body;
      const created = await estacionRepo.create(data);
      res.status(201).json(created);
    } catch (error) {
      console.error('Error creating estacion:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const items = await estacionRepo.getAll();
      res.json(items);
    } catch (error) {
      console.error('Error fetching estaciones:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const item = await estacionRepo.getById(id);
      if (!item) {
        res.status(404).json({ error: 'Estacion not found' });
        return;
      }
      res.json(item);
    } catch (error) {
      console.error(`Error fetching estacion ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const data: Partial<Estacion> = req.body;
      const updated = await estacionRepo.update(id, data);
      if (!updated) {
        res.status(404).json({ error: 'Estacion not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error(`Error updating estacion ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const deleted = await estacionRepo.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Estacion not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting estacion ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getByNegocioId(req: Request, res: Response): Promise<void> {
    const { negocioId } = req.params;
    try {
      const items = await estacionRepo.getByNegocioId(negocioId);
      res.json(items);
    } catch (error) {
      console.error(`Error fetching estaciones for negocio ${negocioId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Actualiza el estado solo_premium de una estación
   * Solo puede ser llamado por el admin del negocio
   */
  async updateSoloPremium(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { solo_premium } = req.body;

    if (typeof solo_premium !== 'boolean') {
      res.status(400).json({ error: 'solo_premium debe ser un booleano' });
      return;
    }

    try {
      const updated = await estacionRepo.actualizarSoloPremium(id, solo_premium);
      if (!updated) {
        res.status(404).json({ error: 'Estación no encontrada' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error(`Error updating solo_premium for estacion ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Obtiene estaciones premium de un negocio
   */
  async getPremiumByNegocioId(req: Request, res: Response): Promise<void> {
    const { negocioId } = req.params;
    try {
      const items = await estacionRepo.getPremiumByNegocioId(negocioId);
      res.json(items);
    } catch (error) {
      console.error(`Error fetching premium estaciones for negocio ${negocioId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Obtiene estaciones normales (no premium) de un negocio
   */
  async getNormalesByNegocioId(req: Request, res: Response): Promise<void> {
    const { negocioId } = req.params;
    try {
      const items = await estacionRepo.getNormalesByNegocioId(negocioId);
      res.json(items);
    } catch (error) {
      console.error(`Error fetching normal estaciones for negocio ${negocioId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
