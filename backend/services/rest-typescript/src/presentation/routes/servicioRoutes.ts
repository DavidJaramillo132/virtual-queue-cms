import { Router } from 'express';
import { ServicioController } from '../controller/ServicioController';
import { authMiddleware } from '../middlewares/Middleware';

const router = Router();
const controller = new ServicioController();

// Todas las rutas de servicios requieren autenticación
router.post('/', authMiddleware, (req, res) => controller.create(req, res));
router.get('/', authMiddleware, (req, res) => controller.getAll(req, res));
router.get('/:id', authMiddleware, (req, res) => controller.getById(req, res));
router.put('/:id', authMiddleware, (req, res) => controller.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => controller.delete(req, res));

export default router;
