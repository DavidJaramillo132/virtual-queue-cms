import { Request, Response } from 'express';
import { Cita } from '../../entities/Cita';
import { CitaRepo } from '../../repository/CitaRepo';

const citaRepo = new CitaRepo();

export class CitaController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data: Partial<Cita> = req.body;
      
      // Obtener cliente_id del token (req.user viene del middleware de autenticación)
      if (req.user && req.user.id) {
        data.cliente_id = req.user.id;
      }
      
      // Log para debug
      console.log('Datos recibidos para crear cita:', JSON.stringify(data, null, 2));
      
      // Validar campos requeridos
      if (!data.fecha) {
        res.status(400).json({ error: 'El campo "fecha" es requerido' });
        return;
      }
      
      if (!data.hora_inicio) {
        res.status(400).json({ error: 'El campo "hora_inicio" es requerido' });
        return;
      }
      
      if (!data.hora_fin) {
        res.status(400).json({ error: 'El campo "hora_fin" es requerido' });
        return;
      }
      
      if (!data.cliente_id) {
        res.status(400).json({ error: 'El campo "cliente_id" es requerido' });
        return;
      }
      
      if (!data.negocio_id) {
        res.status(400).json({ error: 'El campo "negocio_id" es requerido' });
        return;
      }
      
      if (!data.servicio_id) {
        res.status(400).json({ error: 'El campo "servicio_id" es requerido' });
        return;
      }

      if (!data.estacion_id) {
        res.status(400).json({ error: 'El campo "estacion_id" es requerido. Debe seleccionar una fila (estación).' });
        return;
      }
      
      const created = await citaRepo.create(data);
      res.status(201).json(created);
    } catch (error: any) {
      console.error('Error creating cita:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // Enviar mensaje de error más descriptivo
      const errorMessage = error.message || 'Internal server error';
      res.status(500).json({ 
        error: 'Error al crear la cita',
        message: errorMessage,
        details: error.detail || error.driverError?.detail
      });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { negocio_id, estacion_id, cliente_id } = req.query;
      
      let items: Cita[];
      
      // Filtrar por negocio
      if (negocio_id && typeof negocio_id === 'string') {
        items = await citaRepo.getByNegocioId(negocio_id);
      }
      // Filtrar por estación
      else if (estacion_id && typeof estacion_id === 'string') {
        items = await citaRepo.getByEstacionId(estacion_id);
      }
      // Filtrar por cliente
      else if (cliente_id && typeof cliente_id === 'string') {
        items = await citaRepo.getByClienteId(cliente_id);
      }
      // Sin filtros, devolver todas
      else {
        items = await citaRepo.getAll();
      }
      
      res.json(items);
    } catch (error) {
      console.error('Error fetching citas:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const item = await citaRepo.getById(id);
      if (!item) {
        res.status(404).json({ error: 'Cita not found' });
        return;
      }
      res.json(item);
    } catch (error) {
      console.error(`Error fetching cita ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const data: Partial<Cita> = req.body;
      const updated = await citaRepo.update(id, data);
      if (!updated) {
        res.status(404).json({ error: 'Cita not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error(`Error updating cita ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    try {
      const deleted = await citaRepo.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Cita not found' });
        return;
      }
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting cita ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
