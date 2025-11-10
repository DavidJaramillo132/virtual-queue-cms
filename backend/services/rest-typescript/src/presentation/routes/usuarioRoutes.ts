import { Router, Request , Response } from 'express';

import { UsuarioController } from '../controller/UsuarioController';
import { PdfController } from '../controller/PdfController';
import { authMiddleware } from '../middlewares/Middleware';
import { AuthController } from '../controller/AuthController';

const router = Router();
const controller = new UsuarioController();
const pdfController = new PdfController();
const authController = new AuthController();

// POST /api/usuarios (público - registro)
router.post('/', (req: Request, res: Response) => controller.createUsuario(req, res));

// POST /api/usuarios/login (público - autenticación)
router.post('/login', (req: Request, res: Response) => authController.login(req, res));

// GET /api/usuarios/informe-pdf (protegido - generar PDF)
router.get('/informe-pdf', authMiddleware, (req: Request, res: Response) => pdfController.generarInformePerfil(req, res));

// GET /api/usuarios (protegido)
router.get('/', authMiddleware, (req: Request, res: Response) => controller.getAllUsuarios(req, res));

// GET /api/usuarios/:email (protegido)
router.get('/:email', authMiddleware, (req: Request, res: Response) => controller.getUsuarioByEmail(req, res));

// PUT /api/usuarios/:id (protegido)
router.put('/:id', authMiddleware, (req: Request, res: Response) => controller.updateUsuario(req, res));

// DELETE /api/usuarios/:id (protegido)
router.delete('/:id', authMiddleware, (req: Request, res: Response) => controller.deleteUsuario(req, res));

export default router;
