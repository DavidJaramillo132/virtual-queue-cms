# Panel de Administración General

Este módulo contiene todos los componentes necesarios para el panel de administración general del sistema, que gestiona todos los negocios y usuarios de la plataforma.

## Estructura

```
adminGeneral/
├── admin-general.ts                 # Componente principal con navegación por tabs
├── admin-general.html               # Template del panel principal
├── admin-general.css                # Estilos del panel principal
├── estadisticas-general/            # Componente de estadísticas globales
│   ├── estadisticas-general.ts
│   ├── estadisticas-general.html
│   └── estadisticas-general.css
├── negocios/                        # Componente de gestión de negocios
│   ├── negocios.ts
│   ├── negocios.html
│   └── negocios.css
├── usuarios/                        # Componente de gestión de usuarios
│   ├── usuarios.ts
│   ├── usuarios.html
│   └── usuarios.css
├── reportes/                        # Componente de generación de reportes
│   ├── reportes.ts
│   ├── reportes.html
│   └── reportes.css
└── interfaces/
    └── admin-general.interfaces.ts  # Interfaces TypeScript compartidas
```

## Componentes

### 1. AdminGeneral (Componente Principal)
- **Ruta**: `/admin-general`
- **Descripción**: Componente contenedor que gestiona la navegación entre las diferentes secciones del panel de administración general
- **Características**:
  - Sistema de tabs para navegar entre secciones
  - Diseño responsive con Tailwind CSS
  - Usa signals de Angular para manejo de estado reactivo

### 2. Estadísticas General
- **Descripción**: Muestra métricas globales de toda la plataforma
- **Métricas incluidas**:
  - Total de negocios registrados
  - Total de usuarios en la plataforma
  - Total de citas del mes
  - Porcentaje de crecimiento
  - Advertencias activas
  - Distribución de negocios por categoría
  - Actividad reciente de la plataforma

### 3. Negocios
- **Descripción**: Gestiona todos los negocios registrados en la plataforma
- **Funcionalidades**:
  - Listar todos los negocios
  - Buscar negocios por nombre, categoría o email
  - Ver detalles de cada negocio
  - Emitir advertencias a negocios
  - Eliminar negocios de la plataforma
  - Indicadores visuales de estado (Activo, Advertido)

### 4. Usuarios
- **Descripción**: Administra todos los usuarios de la plataforma
- **Funcionalidades**:
  - Listar todos los usuarios
  - Filtrar por rol (Cliente, Admin Local, Admin Sistema)
  - Buscar usuarios por nombre o email
  - Ver información de cada usuario
  - Eliminar usuarios de la plataforma
  - Badges diferenciados por rol

### 5. Reportes
- **Descripción**: Genera reportes detallados de la plataforma
- **Tipos de reportes**:
  - **Reporte de Negocios**: Estadísticas de todos los negocios
  - **Reporte de Usuarios**: Análisis de usuarios
  - **Reporte de Citas**: Estadísticas de citas
  - **Reporte Financiero**: Análisis de ingresos
- **Funcionalidades**:
  - Vista previa del contenido de cada reporte
  - Descarga de reportes (preparado para PDF/Excel)

## Servicio de Datos

El servicio `AdminGeneralService` está preparado para conectarse a la API del backend:

```typescript
// Ubicación: src/app/services/admin-general.service.ts
```

### Endpoints Preparados

#### Estadísticas Generales
- `GET /api/admin/estadisticas` - Obtener estadísticas globales
- `GET /api/admin/categorias` - Obtener distribución por categorías
- `GET /api/admin/actividad-reciente` - Obtener actividad reciente

#### Negocios
- `GET /api/admin/negocios` - Obtener todos los negocios
- `POST /api/admin/negocios/:id/advertencia` - Emitir advertencia
- `DELETE /api/admin/negocios/:id` - Eliminar negocio

#### Usuarios
- `GET /api/admin/usuarios?rol=:rol` - Obtener usuarios (con filtro opcional)
- `DELETE /api/admin/usuarios/:id` - Eliminar usuario

#### Reportes
- `GET /api/admin/reportes/:tipo` - Obtener datos del reporte
- `GET /api/admin/reportes/:tipo/descargar?formato=pdf|excel` - Descargar reporte

## Diferencias con AdminLocal

| Característica | AdminLocal | AdminGeneral |
|---------------|------------|--------------|
| **Alcance** | Un solo negocio | Toda la plataforma |
| **Usuarios** | Administra su negocio | Administra todos los negocios y usuarios |
| **Permisos** | Limitado a su negocio | Acceso total al sistema |
| **Funciones** | Gestión operativa | Gestión estratégica y supervisión |
| **Reportes** | Del negocio específico | De toda la plataforma |

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

4. **Inyectar el servicio en los componentes:**
```typescript
constructor(private adminGeneralService: AdminGeneralService) {}

ngOnInit() {
  this.adminGeneralService.getEstadisticasGenerales().subscribe(data => {
    this.estadisticas.set(data);
  });
}
```

## Autenticación y Autorización

Este módulo debe estar protegido y solo accesible para usuarios con rol **Admin Sistema**. 

Ejemplo de guard:

```typescript
// admin-general.guard.ts
export const adminGeneralGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  
  if (authService.getUserRole() === 'Admin Sistema') {
    return true;
  }
  
  return false;
};
```

Aplicar en las rutas:

```typescript
{
  path: 'admin-general',
  canActivate: [adminGeneralGuard],
  loadComponent: () => import('./presentation/adminGeneral/admin-general')
}
```

## Estilos

- **Framework CSS**: Tailwind CSS
- **Botones**: Fondo negro (`bg-black`) con hover a gris oscuro
- **Cards**: Fondo blanco con sombra y borde gris
- **Badges de rol**: Diferentes tonos de negro/gris según el rol
- **Badges de estado**: Negro para activo, amarillo para advertido

## Características Técnicas

- **Angular Standalone Components**: Todos los componentes son standalone
- **Signals**: Uso de signals para manejo de estado reactivo
- **TypeScript**: Tipado completo con interfaces
- **Responsive**: Diseño adaptable con Tailwind
- **FontAwesome**: Iconos integrados
- **FormsModule**: Para formularios y búsqueda

## Uso

### Navegar al panel:
```typescript
this.router.navigate(['/admin-general']);
```

### Flujo de trabajo típico:

1. **Monitoreo**: Ver estadísticas generales
2. **Supervisión**: Revisar negocios y usuarios
3. **Acción**: Emitir advertencias o eliminar entidades
4. **Análisis**: Generar reportes para toma de decisiones

## Seguridad

⚠️ **IMPORTANTE**: Este módulo debe tener las siguientes medidas de seguridad:

- [ ] Autenticación obligatoria
- [ ] Verificación de rol Admin Sistema
- [ ] Auditoría de todas las acciones críticas
- [ ] Confirmación doble para eliminaciones
- [ ] Registro de advertencias emitidas
- [ ] Límite de intentos de acceso

## TODO

- [ ] Implementar guards de autorización
- [ ] Conectar con API real del backend
- [ ] Agregar sistema de auditoría
- [ ] Implementar confirmación de acciones críticas
- [ ] Agregar paginación para listas grandes
- [ ] Implementar exportación de reportes (PDF, Excel)
- [ ] Agregar gráficas interactivas
- [ ] Implementar sistema de notificaciones
- [ ] Agregar filtros avanzados
- [ ] Implementar búsqueda con debounce
- [ ] Agregar vista de detalles de negocio
- [ ] Implementar sistema de logs de actividad
