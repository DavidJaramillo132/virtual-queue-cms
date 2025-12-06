import { Request, Response } from 'express';
import { Cita } from '../../entities/Cita';
import { CitaRepo } from '../../repository/CitaRepo';
import { WebSocketNotificationService } from '../../services/websocket-notification.service';

const citaRepo = new CitaRepo();
const websocketNotificationService = new WebSocketNotificationService();

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
      
      console.log(' Cita creada exitosamente:', JSON.stringify(created, null, 2));
      
      // Notificar al WebSocket sobre la nueva cita (de forma asíncrona, no bloquea la respuesta)
      // Usar el negocio_id del objeto creado para asegurarse de que sea el correcto
      const negocioId = created.negocio_id || data.negocio_id;
      
      if (negocioId) {
        console.log(` [CitaController] Notificando WebSocket sobre nueva cita para negocio: ${negocioId}`);
        console.log(` [CitaController] Cita ID: ${created.id}`);
        
        // Llamar de forma asíncrona pero asegurarse de que se ejecute
        websocketNotificationService.notifyCitaChange(negocioId, 'created')
          .then(() => {
            console.log(` [CitaController] Notificación WebSocket completada para negocio: ${negocioId}`);
          })
          .catch(err => {
            console.error(` [CitaController] Error notificando nueva cita al WebSocket:`, err.message);
            if (err.code) {
              console.error(` [CitaController] Error code: ${err.code}`);
            }
            if (err.response) {
              console.error(` [CitaController] Response status: ${err.response.status}`);
              console.error(` [CitaController] Response data:`, err.response.data);
            }
            if (err.stack) {
              console.error(` [CitaController] Stack trace:`, err.stack);
            }
          });
      } else {
        console.warn(' [CitaController] No se pudo obtener negocio_id para notificar al WebSocket');
        console.warn(' [CitaController] Created object:', JSON.stringify(created, null, 2));
        console.warn(' [CitaController] Data object:', JSON.stringify(data, null, 2));
      }
      
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
      
      // Obtener la cita antes de actualizar para saber el negocio_id
      const existingCita = await citaRepo.getById(id);
      if (!existingCita) {
        res.status(404).json({ error: 'Cita not found' });
        return;
      }
      
      const updated = await citaRepo.update(id, data);
      if (!updated) {
        res.status(404).json({ error: 'Cita not found' });
        return;
      }
      
      // Determinar la acción basada en los cambios
      const action = data.estado ? 'status_changed' : 'updated';
      
      // Notificar al WebSocket sobre la actualización (de forma asíncrona)
      if (updated.negocio_id) {
        websocketNotificationService.notifyCitaChange(updated.negocio_id, action).catch(err => {
          console.error('Error notificando actualización de cita al WebSocket:', err);
        });
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
      // Obtener la cita antes de eliminar para saber el negocio_id
      const existingCita = await citaRepo.getById(id);
      if (!existingCita) {
        res.status(404).json({ error: 'Cita not found' });
        return;
      }
      
      const negocioId = existingCita.negocio_id;
      const deleted = await citaRepo.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Cita not found' });
        return;
      }
      
      // Notificar al WebSocket sobre la eliminación (de forma asíncrona)
      websocketNotificationService.notifyCitaChange(negocioId, 'deleted').catch(err => {
        console.error('Error notificando eliminación de cita al WebSocket:', err);
      });
      
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting cita ${id}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
