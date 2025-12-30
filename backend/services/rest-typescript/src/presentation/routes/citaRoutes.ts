import { Router } from 'express';
import { CitaController } from '../controller/CitaController';
import { authMiddleware } from '../middlewares/Middleware';

const router = Router();
const controller = new CitaController();

// Rutas de citas
router.post('/', (req, res) => controller.create(req, res));
router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', authMiddleware, (req, res) => controller.getById(req, res));
router.put('/:id', authMiddleware, (req, res) => controller.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => controller.delete(req, res));

export default router;
