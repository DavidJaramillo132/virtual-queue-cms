# Repositories (src/repository)

Propósito
--
Los repositorios encapsulan el acceso a datos usando TypeORM. Aquí colocamos funciones que interactúan con las entidades (consultas, inserciones, actualizaciones, borrados). Mantener la lógica de acceso a datos separada ayuda a probar y reutilizar el código.

Convenciones
--
- Cada entidad suele tener su propio repositorio: `UsuarioRepo.ts`, `NegocioRepo.ts`, etc.
- Exportar funciones o una clase/objeto con métodos: `create`, `findAll`, `findById`, `update`, `delete`.
- No incluir lógica de negocio compleja; esa pertenece a capas superiores (controllers/services).

Ejemplo simple (pseudo-uso)
--
import { AppDataSource } from '../database/database';
import { Usuario } from '../entities/Usuario';

const usuarioRepo = AppDataSource.getRepository(Usuario);

export async function createUsuario(data) {
  const usuario = usuarioRepo.create(data);
  return await usuarioRepo.save(usuario);
}

Buenas prácticas
--
- Manejar errores (try/catch) en el nivel donde se pueda responder apropiadamente (controllers suelen transformar errores en respuestas HTTP).
- Usar transacciones cuando se actualicen varias entidades que deben ser consistentes.
- Evitar exponer internals de TypeORM fuera del repo; devuelve DTOs o entidades ya transformadas si hace falta.

Notas
--
- Si tienes lógica de negocio compleja, considera agregar una capa `services/` entre controllers y repositorios.
