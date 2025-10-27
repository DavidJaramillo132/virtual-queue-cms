# Panel de Administración Local

Este módulo contiene todos los componentes necesarios para el panel de administración de negocios locales.

## Estructura

```
adminLocal/
├── admin-local.ts              # Componente principal con navegación por tabs
├── admin-local.html            # Template del panel principal
├── admin-local.css             # Estilos del panel principal
├── estadisticas/               # Componente de estadísticas y métricas
│   ├── estadisticas.ts
│   ├── estadisticas.html
│   └── estadisticas.css
├── negocio-info/              # Componente de información del negocio
│   ├── negocio-info.ts
│   ├── negocio-info.html
│   └── negocio-info.css
├── servicios/                 # Componente de gestión de servicios
│   ├── servicios.ts
│   ├── servicios.html
│   └── servicios.css
├── horarios/                  # Componente de configuración de horarios
│   ├── horarios.ts
│   ├── horarios.html
│   └── horarios.css
└── citas/                     # Componente de gestión de citas
    ├── citas.ts
    ├── citas.html
    └── citas.css
```

## Componentes

### 1. AdminLocal (Componente Principal)
- **Ruta**: `/admin-local`
- **Descripción**: Componente contenedor que gestiona la navegación entre las diferentes secciones del panel
- **Características**:
  - Sistema de tabs para navegar entre secciones
  - Diseño responsive con Tailwind CSS
  - Usa signals de Angular para manejo de estado reactivo

### 2. Estadísticas
- **Descripción**: Muestra métricas clave del negocio
- **Métricas incluidas**:
  - Total de citas del mes
  - Citas activas hoy
  - Tiempo promedio de espera
  - Calificación de satisfacción
  - Resumen de actividad (completadas, canceladas, nuevos clientes)

### 3. Negocio Info
- **Descripción**: Gestiona la información del negocio
- **Funcionalidades**:
  - Ver información del negocio
  - Editar información (nombre, categoría, descripción, dirección, teléfono, email)
  - Modo de edición con validación

### 4. Servicios
- **Descripción**: Administra los servicios ofrecidos
- **Funcionalidades**:
  - Listar servicios con sus detalles
  - Agregar nuevos servicios
  - Editar servicios existentes
  - Eliminar servicios
  - Toggle de estado activo/inactivo
  - Modal para crear/editar

### 5. Horarios
- **Descripción**: Configura los horarios de atención
- **Funcionalidades**:
  - Configurar horarios para cada día de la semana
  - Toggle para habilitar/deshabilitar días
  - Selección de hora de apertura y cierre
  - Formato de 24 horas

### 6. Citas
- **Descripción**: Gestiona las citas programadas
- **Funcionalidades**:
  - Listar citas con filtros por estado
  - Ver detalles de cada cita
  - Cambiar estado de citas (confirmar, iniciar, completar, cancelar)
  - Estados: Confirmada, Pendiente, En Progreso, Completada, Cancelada

## Servicio de Datos

El servicio `AdminLocalService` está preparado para conectarse a la API del backend:

```typescript
// Ubicación: src/app/services/admin-local.service.ts
```

### Endpoints Preparados

#### Estadísticas
- `GET /api/estadisticas/:negocioId` - Obtener estadísticas

#### Negocio
- `GET /api/negocio/:id` - Obtener información del negocio
- `PUT /api/negocio/:id` - Actualizar información del negocio

#### Servicios
- `GET /api/servicios?negocioId=:id` - Obtener servicios
- `POST /api/servicios` - Crear servicio
- `PUT /api/servicios/:id` - Actualizar servicio
- `DELETE /api/servicios/:id` - Eliminar servicio

#### Horarios
- `GET /api/horarios?negocioId=:id` - Obtener horarios
- `PUT /api/horarios/:negocioId` - Actualizar horarios

#### Citas
- `GET /api/citas?negocioId=:id` - Obtener citas
- `PATCH /api/citas/:id/estado` - Actualizar estado de cita
- `DELETE /api/citas/:id` - Cancelar cita

## Conexión a Base de Datos

### Pasos para conectar con el backend:

1. **Descomentar HttpClient en el servicio:**
```typescript
import { HttpClient } from '@angular/common/http';

constructor(private http: HttpClient) {}
```

2. **Configurar la URL de la API:**
```typescript
private readonly API_URL = 'http://localhost:3000/api'; // Tu URL
```

3. **Descomentar las llamadas HTTP en cada método**

4. **Inyectar el servicio en los componentes y usar los métodos:**
```typescript
constructor(private adminService: AdminLocalService) {}

ngOnInit() {
  this.adminService.getEstadisticas(this.negocioId).subscribe(data => {
    this.estadisticas.set(data);
  });
}
```

## Estilos

- **Framework CSS**: Tailwind CSS
- **Botones**: Fondo negro (`bg-black`) con hover a gris oscuro
- **Cards**: Fondo blanco con sombra y borde gris
- **Estados**: Colores diferenciados (azul=confirmada, amarillo=pendiente, verde=en progreso)

## Características Técnicas

- **Angular Standalone Components**: Todos los componentes son standalone
- **Signals**: Uso de signals para manejo de estado reactivo
- **TypeScript**: Tipado completo con interfaces
- **Responsive**: Diseño adaptable con Tailwind
- **FontAwesome**: Iconos integrados
- **FormsModule**: Para formularios y two-way binding

## Uso

### Navegar al panel:
```typescript
this.router.navigate(['/admin-local']);
```

### Acceder desde la barra de navegación o menú principal del negocio

## TODO

- [ ] Conectar con API real del backend
- [ ] Implementar autenticación y autorización
- [ ] Agregar validaciones de formularios
- [ ] Implementar manejo de errores
- [ ] Agregar loading states
- [ ] Implementar paginación para listas grandes
- [ ] Agregar notificaciones toast
- [ ] Implementar búsqueda y filtros avanzados
- [ ] Agregar gráficas para estadísticas
- [ ] Implementar export de datos (CSV, PDF)
