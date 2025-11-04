# Implementación de Funcionalidad REST en AdminLocal

## Resumen de Cambios

Se ha implementado funcionalidad CRUD completa con el backend REST para todos los componentes de la carpeta `adminLocal`. Ahora los componentes se conectan al backend en `http://localhost:3000/api/` para realizar operaciones reales de base de datos.

## 📁 Archivos Creados

### Servicios REST Nuevos

1. **`cita-services.ts`** - Servicio completo para gestión de citas
   - ✅ `getAllCitas()` - Obtener todas las citas
   - ✅ `getCitasByEstado()` - Filtrar por estado
   - ✅ `getCitasByUsuario()` - Filtrar por usuario
   - ✅ `getCitasByServicio()` - Filtrar por servicio
   - ✅ `getCitaById()` - Obtener una cita específica
   - ✅ `createCita()` - Crear nueva cita
   - ✅ `updateCita()` - Actualizar cita existente
   - ✅ `updateEstadoCita()` - Cambiar solo el estado
   - ✅ `deleteCita()` - Eliminar cita

2. **`horario-services.ts`** - Servicio completo para gestión de horarios
   - ✅ `getAllHorarios()` - Obtener todos los horarios
   - ✅ `getHorariosByEstacion()` - Filtrar por estación
   - ✅ `getHorarioById()` - Obtener horario específico
   - ✅ `createHorario()` - Crear nuevo horario
   - ✅ `updateHorario()` - Actualizar horario existente
   - ✅ `updateMultipleHorarios()` - Actualización en lote
   - ✅ `deleteHorario()` - Eliminar horario

## 📝 Archivos Actualizados

### Servicios REST Existentes

3. **`servicio-servicios.ts`** - Completado con CRUD completo
   - ✅ `getAllServicios()` - Obtener todos los servicios
   - ✅ `getServiciosByNegocio()` - Filtrar por negocio
   - ✅ `getServicioById()` - Obtener servicio específico
   - ✅ `agregarServicio()` - Crear nuevo servicio
   - ✅ `actualizarServicio()` - Actualizar servicio existente
   - ✅ `eliminarServicio()` - Eliminar servicio

### Componentes de AdminLocal

4. **`citas/citas.ts`** - Componente de gestión de citas
   - ✅ Integración con `CitaService`
   - ✅ Carga de citas desde el servidor
   - ✅ Cambio de estado (pendiente, atendida, cancelada)
   - ✅ Eliminación de citas
   - ✅ Manejo de estados de carga y errores
   - ✅ Mensajes de éxito y error

5. **`servicios/servicios.ts`** - Componente de gestión de servicios
   - ✅ Integración con `ServicioServicios`
   - ✅ Carga de servicios desde el servidor
   - ✅ Crear nuevos servicios
   - ✅ Editar servicios existentes
   - ✅ Eliminar servicios
   - ✅ Toggle de visibilidad (activar/desactivar)
   - ✅ Modal para crear/editar
   - ✅ Manejo de estados de carga y errores

6. **`horarios/horarios.ts`** - Componente de gestión de horarios
   - ✅ Integración con `HorarioService`
   - ✅ Carga de horarios desde el servidor
   - ✅ Actualización en lote de horarios
   - ✅ Toggle de días activos/inactivos
   - ✅ Manejo de estados de carga y errores

## 🔧 Características Implementadas

### Manejo de Autenticación
- Todos los servicios incluyen headers de autenticación JWT
- Token obtenido de `localStorage.getItem('token')`
- Headers automáticos en operaciones protegidas

### Manejo de Errores
- Captura de errores HTTP
- Mensajes de error amigables para el usuario
- Logging en consola para debugging
- Timeout automático de mensajes (3 segundos)

### Estados de UI
Todos los componentes ahora incluyen:
- `isLoading` - Indicador de carga
- `errorMessage` - Mensaje de error
- `successMessage` - Mensaje de éxito
- Actualización reactiva con Angular Signals

### Operaciones CRUD Completas

#### Citas
- **Create**: Crear nuevas citas (requiere autenticación)
- **Read**: Listar todas las citas, filtrar por estado/usuario/servicio
- **Update**: Modificar citas existentes, cambiar estado
- **Delete**: Eliminar citas permanentemente

#### Servicios
- **Create**: Agregar nuevos servicios al negocio
- **Read**: Listar todos los servicios o filtrar por negocio
- **Update**: Modificar servicios existentes, toggle de visibilidad
- **Delete**: Eliminar servicios

#### Horarios
- **Create**: Crear horarios de atención
- **Read**: Listar horarios por estación
- **Update**: Modificar horarios, actualización en lote
- **Delete**: Eliminar horarios específicos

## 🌐 Endpoints del Backend

### Citas (`/api/citas`)
```
GET    /api/citas           - Obtener todas las citas
GET    /api/citas/:id       - Obtener una cita (auth requerida)
POST   /api/citas           - Crear cita (auth requerida)
PUT    /api/citas/:id       - Actualizar cita (auth requerida)
DELETE /api/citas/:id       - Eliminar cita (auth requerida)
```

### Servicios (`/api/servicios`)
```
GET    /api/servicios       - Obtener todos los servicios
GET    /api/servicios/:id   - Obtener un servicio
POST   /api/servicios       - Crear servicio (auth requerida)
PUT    /api/servicios/:id   - Actualizar servicio (auth requerida)
DELETE /api/servicios/:id   - Eliminar servicio (auth requerida)
```

### Horarios (`/api/horarios-atencion`)
```
GET    /api/horarios-atencion       - Obtener todos los horarios
GET    /api/horarios-atencion/:id   - Obtener un horario
POST   /api/horarios-atencion       - Crear horario (auth requerida)
PUT    /api/horarios-atencion/:id   - Actualizar horario (auth requerida)
DELETE /api/horarios-atencion/:id   - Eliminar horario (auth requerida)
```

## 🚀 Cómo Usar

### 1. Asegúrate de que el backend esté corriendo
```bash
cd backend/services/rest-typescript
npm run dev
```

El servidor debe estar en `http://localhost:3000`

### 2. Asegúrate de tener un token JWT válido
Los componentes obtienen el token de `localStorage`:
```javascript
const token = localStorage.getItem('token');
```

### 3. Inicia el frontend
```bash
cd frontend/virtual-queue-cms
npm start
```

### 4. Navega a AdminLocal
Accede a la ruta `/admin-local` y utiliza los tabs para:
- **Citas**: Gestionar citas de clientes
- **Servicios**: Administrar servicios del negocio
- **Horarios**: Configurar horarios de atención

## 📋 Interfaces y Tipos

### ICita
```typescript
interface ICita {
  id: string;
  usuario_id?: string;
  servicio_id?: string;
  fecha: Date;
  hora_inicio: string;
  hora_fin: string;
  estado: 'pendiente' | 'atendida' | 'cancelada';
  creado_en: Date;
}
```

### IServicio
```typescript
interface IServicio {
  id: string;
  negocio_id: string;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  duracion_minutos?: number;
  capacidad?: number;
  visible: boolean;
}
```

### IHorarioAtencion
```typescript
interface IHorarioAtencion {
  id: string;
  idEstacion: string;
  diaSemana: string;  // "0" a "6" (Domingo a Sábado)
  horaInicio: string; // "HH:mm"
  horaFin: string;    // "HH:mm"
}
```

## ⚠️ Consideraciones

1. **Autenticación**: Asegúrate de tener un token JWT válido en localStorage antes de usar funciones protegidas
2. **CORS**: El backend debe tener CORS configurado para aceptar peticiones desde `http://localhost:4200`
3. **IDs de Negocio/Estación**: Los componentes de servicios y horarios requieren IDs de negocio y estación respectivamente
4. **Estados de Citas**: El backend solo acepta 3 estados: 'pendiente', 'atendida', 'cancelada'

## 🔜 Mejoras Futuras

- [ ] Agregar paginación para listas grandes
- [ ] Implementar búsqueda y filtros avanzados
- [ ] Agregar validación de formularios más robusta
- [ ] Implementar caché local con RxJS
- [ ] Agregar confirmaciones visuales más elaboradas
- [ ] Implementar undo/redo para operaciones críticas
- [ ] Agregar tests unitarios para servicios
- [ ] Mejorar feedback visual en los HTMLs

## 👥 Componentes Relacionados

- **NegocioInfo**: Gestión de información del negocio (pendiente de integración)
- **Estadísticas**: Dashboard con métricas (pendiente de integración)
- **AdminLocal**: Componente contenedor principal

## 📚 Documentación Adicional

Para más información sobre:
- Entidades del backend: Ver `/backend/services/rest-typescript/src/entities/`
- Rutas del API: Ver `/backend/services/rest-typescript/src/presentation/routes/`
- Interfaces del frontend: Ver `/frontend/virtual-queue-cms/src/app/domain/entities/`

---

**Fecha de implementación**: Noviembre 4, 2025
**Desarrollado para**: Virtual Queue CMS - Panel de Administración Local
