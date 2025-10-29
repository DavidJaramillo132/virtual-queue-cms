import { Router } from 'express';
import { NegocioController } from '../controller/NegocioController';
import { authMiddleware } from '../middlewares/Middleware';

const router = Router();
const controller = new NegocioController();

// Todas las rutas de negocios requieren autenticación
// La ruta es la siguiente: /api/negocios

router.post('/', (req, res) => controller.create(req, res));
// GET /api/negocios publico
router.get('/', (req, res) => controller.getAll(req, res));
// GET /api/negocios/:id publico
router.get('/:id', (req, res) => controller.getById(req, res));
router.put('/:id', authMiddleware, (req, res) => controller.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => controller.delete(req, res));

export default router;
