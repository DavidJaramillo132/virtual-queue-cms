import { Router } from 'express';
import { UsuarioController } from '../controller/UsuarioController';
import { authMiddleware } from '../middlewares/Middleware';
import { AuthController } from '../controller/AuthController';

const router = Router();
const controller = new UsuarioController();
const authController = new AuthController();

// POST /api/usuarios (público - registro)
router.post('/', (req, res) => controller.createUsuario(req, res));

// POST /api/usuarios/login (público - autenticación)
router.post('/login', (req, res) => authController.login(req, res));

// GET /api/usuarios (protegido)
router.get('/', authMiddleware, (req, res) => controller.getAllUsuarios(req, res));

// GET /api/usuarios/:email (protegido)
router.get('/:email', authMiddleware, (req, res) => controller.getUsuarioByEmail(req, res));

// PUT /api/usuarios/:id (protegido)
router.put('/:id', authMiddleware, (req, res) => controller.updateUsuario(req, res));

// DELETE /api/usuarios/:id (protegido)
router.delete('/:id', authMiddleware, (req, res) => controller.deleteUsuario(req, res));

export default router;
