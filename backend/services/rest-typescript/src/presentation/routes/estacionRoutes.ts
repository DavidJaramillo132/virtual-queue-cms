import { Router } from 'express';
import { EstacionController } from '../controller/EstacionController';
import { authMiddleware } from '../middlewares/Middleware';

const router = Router();
const controller = new EstacionController();

// Rutas de estaciones
router.post('/', authMiddleware, (req, res) => controller.create(req, res));
router.get('/', authMiddleware, (req, res) => controller.getAll(req, res));

// Rutas por negocio
router.get('/negocio/:negocioId', (req, res) => controller.getByNegocioId(req, res));
router.get('/negocio/:negocioId/premium', (req, res) => controller.getPremiumByNegocioId(req, res));
router.get('/negocio/:negocioId/normales', (req, res) => controller.getNormalesByNegocioId(req, res));

// Rutas por ID
router.get('/:id', authMiddleware, (req, res) => controller.getById(req, res));
router.put('/:id', authMiddleware, (req, res) => controller.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => controller.delete(req, res));

// Actualizar estado solo_premium (solo admin del negocio)
router.patch('/:id/premium', authMiddleware, (req, res) => controller.updateSoloPremium(req, res));

export default router;
