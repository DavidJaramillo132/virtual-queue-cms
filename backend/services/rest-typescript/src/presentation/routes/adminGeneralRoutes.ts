import { Router } from 'express';
import { AdminGeneralController } from '../controller/AdminGeneralController';
import { authMiddleware } from '../middlewares/Middleware';

const router = Router();
const controller = new AdminGeneralController();

// Todas las rutas de admin general requieren autenticación
router.get('/estadisticas', authMiddleware, (req, res) => controller.getEstadisticas(req, res));
router.get('/categorias', authMiddleware, (req, res) => controller.getCategorias(req, res));

export default router;

