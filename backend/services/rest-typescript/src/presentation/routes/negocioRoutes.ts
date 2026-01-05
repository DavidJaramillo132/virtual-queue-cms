import { Router } from 'express';
import { NegocioController } from '../controller/NegocioController';
import { authMiddleware } from '../middlewares/Middleware';

const router = Router();
const controller = new NegocioController();

// Rutas de negocios
// La ruta base es: /api/negocios

router.post('/', (req, res) => controller.create(req, res));
// GET /api/negocios - Lista todos los negocios (soporta ?search=termino)
router.get('/', (req, res) => controller.getAll(req, res));
// GET /api/negocios/:id - Obtiene un negocio por ID
router.get('/:id', (req, res) => controller.getById(req, res));
router.put('/:id', authMiddleware, (req, res) => controller.update(req, res));
router.delete('/:id', authMiddleware, (req, res) => controller.delete(req, res));

export default router;
