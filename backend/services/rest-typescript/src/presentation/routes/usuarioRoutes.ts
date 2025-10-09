import { Router } from 'express';
import { UsuarioController } from '../controller/UsuarioController';
import { authMiddleware } from '../middlewares/Middleware';
const router = Router();
const controller = new UsuarioController();

// POST /api/usuarios (público - registro)
router.post('/', (req, res) => controller.createUsuario(req, res));

// GET /api/usuarios (protegido)
router.get('/', authMiddleware, (req, res) => controller.getAllUsuarios(req, res));

// GET /api/usuarios/:id (protegido)
router.get('/:id', authMiddleware, (req, res) => controller.getUsuarioById(req, res));

// PUT /api/usuarios/:id (protegido)
router.put('/:id', authMiddleware, (req, res) => controller.updateUsuario(req, res));

// DELETE /api/usuarios/:id (protegido)
router.delete('/:id', authMiddleware, (req, res) => controller.deleteUsuario(req, res));

export default router;
