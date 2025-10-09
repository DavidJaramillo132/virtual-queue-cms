# Routes (src/presentation/routes)

Propósito
--
Define los endpoints HTTP y los middlewares aplicados. Aquí se importan los controllers y se construyen routers de Express.

Ejemplo
--
import { Router } from 'express';
import * as UsuarioController from '../controller/UsuarioController';
import { authMiddleware } from '../middlewares/Middleware';

const router = Router();
router.post('/', UsuarioController.createUsuario); // público
router.get('/', authMiddleware, UsuarioController.getAllUsuarios); // protegido

export default router;

Buenas prácticas
--
- Mantén la definición de rutas simple; aplicar validaciones y auth por ruta según corresponda.
- Documenta los endpoints (ej.: en README principal o usando OpenAPI/Swagger).
