# Controllers (src/presentation/controller)

Propósito
--
Contienen los handlers HTTP que llaman a repositorios/servicios y devuelven respuestas. Cada entidad suele tener un controller con métodos CRUD.

Ejemplo de función en controller
--
export const getUsuarioById = async (req, res) => {
  const { id } = req.params;
  const usuario = await UsuarioRepo.findById(id);
  if (!usuario) return res.status(404).json({ message: 'No encontrado' });
  return res.json(usuario);
}

Buenas prácticas
--
- No incluir lógica compleja: los controllers orquestan llamadas.
- Normalizar respuestas de error.
- Usar try/catch y devolver códigos HTTP adecuados.
