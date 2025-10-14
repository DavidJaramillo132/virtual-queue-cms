# Comparación: Admin Local vs Admin General

## Resumen

Este documento compara las dos interfaces de administración del sistema de gestión de colas virtuales.

## Tabla Comparativa

| Aspecto | Admin Local | Admin General |
|---------|-------------|---------------|
| **Ruta** | `/admin-local` | `/admin-general` |
| **Rol requerido** | Admin Local | Admin Sistema |
| **Alcance** | Un solo negocio | Toda la plataforma |
| **Usuarios gestionados** | Solo su negocio | Todos los usuarios |
| **Negocios gestionados** | Solo el suyo | Todos los negocios |

## Componentes por Módulo

### Admin Local
```
adminLocal/
├── Estadísticas          # Métricas del negocio individual
├── Negocio Info          # Información y configuración del negocio
├── Servicios             # Servicios ofrecidos por el negocio
├── Horarios              # Horarios de atención del negocio
└── Citas                 # Citas programadas del negocio
```

### Admin General
```
adminGeneral/
├── Estadísticas General  # Métricas de toda la plataforma
├── Negocios              # Gestión de todos los negocios
├── Usuarios              # Gestión de todos los usuarios
└── Reportes              # Reportes globales de la plataforma
```

## Funcionalidades Detalladas

### Admin Local - ¿Qué puede hacer?

#### ✅ Estadísticas
- Ver total de citas del mes
- Ver citas activas hoy
- Monitorear tiempo de espera promedio
- Ver calificación de satisfacción
- Revisar resumen de actividad (completadas, canceladas, nuevos clientes)

#### ✅ Información del Negocio
- Ver información del negocio
- Editar datos: nombre, categoría, descripción, dirección, teléfono, email

#### ✅ Servicios
- Listar servicios del negocio
- Crear nuevos servicios
- Editar servicios existentes
- Eliminar servicios
- Activar/desactivar servicios
- Configurar duración y precio

#### ✅ Horarios
- Configurar días de atención
- Establecer horarios de apertura y cierre
- Activar/desactivar días específicos

#### ✅ Citas
- Ver todas las citas programadas
- Filtrar por estado
- Confirmar citas pendientes
- Iniciar citas confirmadas
- Completar citas en progreso
- Cancelar citas

### Admin General - ¿Qué puede hacer?

#### ✅ Estadísticas Generales
- Ver total de negocios en la plataforma
- Monitorear negocios activos vs inactivos
- Ver total de usuarios registrados
- Monitorear total de citas de la plataforma
- Ver porcentaje de crecimiento mensual
- Revisar advertencias activas
- Ver distribución de negocios por categoría
- Monitorear actividad reciente (nuevos registros, advertencias, eliminaciones)

#### ✅ Gestión de Negocios
- Listar todos los negocios
- Buscar negocios
- Ver detalles de cualquier negocio
- **Emitir advertencias** a negocios
- **Eliminar negocios** de la plataforma
- Ver estado de advertencias

#### ✅ Gestión de Usuarios
- Listar todos los usuarios
- Filtrar por rol (Cliente, Admin Local, Admin Sistema)
- Buscar usuarios
- **Eliminar usuarios** de la plataforma
- Ver fecha de registro

#### ✅ Reportes
- Generar reporte de negocios
- Generar reporte de usuarios
- Generar reporte de citas
- Generar reporte financiero
- Descargar reportes (preparado para PDF/Excel)

## Permisos y Acciones Críticas

### ⚠️ Acciones que SOLO puede hacer Admin General

1. **Ver datos de todos los negocios**
2. **Emitir advertencias a negocios**
3. **Eliminar negocios**
4. **Eliminar usuarios**
5. **Ver estadísticas globales**
6. **Generar reportes de toda la plataforma**

### ✅ Acciones que SOLO puede hacer Admin Local

1. **Editar información de su negocio**
2. **Gestionar servicios de su negocio**
3. **Configurar horarios de su negocio**
4. **Gestionar citas de su negocio**

## Flujos de Trabajo

### Flujo Típico: Admin Local

```
1. Login con credenciales de Admin Local
2. Navegar a /admin-local
3. Ver estadísticas de su negocio
4. Gestionar servicios
5. Configurar horarios
6. Atender citas del día
   ├─ Confirmar citas pendientes
   ├─ Iniciar citas confirmadas
   └─ Completar o cancelar citas
```

### Flujo Típico: Admin General

```
1. Login con credenciales de Admin Sistema
2. Navegar a /admin-general
3. Monitorear estadísticas globales
4. Revisar actividad reciente
5. Supervisar negocios
   ├─ Buscar negocios problemáticos
   ├─ Emitir advertencias si es necesario
   └─ Eliminar negocios si procede
6. Gestionar usuarios
   ├─ Revisar nuevos registros
   └─ Eliminar cuentas duplicadas/spam
7. Generar reportes para análisis
```

## Rutas y Navegación

```typescript
// Admin Local
{
  path: 'admin-local',
  canActivate: [adminLocalGuard], // Verifica rol "Admin Local"
  loadComponent: () => import('./presentation/adminLocal/admin-local')
}

// Admin General
{
  path: 'admin-general',
  canActivate: [adminGeneralGuard], // Verifica rol "Admin Sistema"
  loadComponent: () => import('./presentation/adminGeneral/admin-general')
}
```

## Servicios de Backend

### Admin Local Service
```typescript
// Endpoints para gestión del negocio específico
- GET /api/negocio/:id
- PUT /api/negocio/:id
- GET /api/servicios?negocioId=:id
- GET /api/horarios?negocioId=:id
- GET /api/citas?negocioId=:id
```

### Admin General Service
```typescript
// Endpoints para gestión global
- GET /api/admin/estadisticas
- GET /api/admin/negocios (todos)
- POST /api/admin/negocios/:id/advertencia
- DELETE /api/admin/negocios/:id
- GET /api/admin/usuarios
- DELETE /api/admin/usuarios/:id
- GET /api/admin/reportes/:tipo
```

## Seguridad

### Admin Local
- ✅ Acceso protegido por autenticación
- ✅ Verificación de rol "Admin Local"
- ✅ Solo puede ver/editar SU negocio
- ⚠️ No puede ver otros negocios
- ⚠️ No puede eliminar usuarios

### Admin General
- ✅ Acceso protegido por autenticación
- ✅ Verificación de rol "Admin Sistema"
- ✅ Puede ver TODOS los negocios
- ✅ Puede ver TODOS los usuarios
- ⚠️ Requiere auditoría de acciones
- ⚠️ Confirmación doble para eliminaciones
- ⚠️ Registro de todas las acciones críticas

## Ejemplo de Uso

### Caso 1: Dueño de Restaurante (Admin Local)

**María** es dueña del "Restaurante El Buen Sabor"

1. Accede a `/admin-local`
2. Ve las estadísticas de su restaurante
3. Edita el menú (servicios)
4. Configura horarios: Lunes a Viernes 10am-10pm
5. Gestiona reservas del día

**María NO puede:**
- Ver otros restaurantes
- Ver usuarios que no tienen citas en su negocio
- Eliminar su negocio
- Acceder a `/admin-general`

### Caso 2: Administrador de Plataforma (Admin General)

**Carlos** es el administrador del sistema

1. Accede a `/admin-general`
2. Ve estadísticas de toda la plataforma
3. Nota que un negocio tiene muchas quejas
4. Busca el negocio en la lista
5. Emite una advertencia
6. Si persiste el problema, puede eliminar el negocio
7. Genera reportes mensuales

**Carlos puede:**
- Ver y administrar TODO
- Emitir advertencias
- Eliminar negocios y usuarios
- Generar reportes globales
- **NO puede** editar servicios o horarios de un negocio específico
  (eso le corresponde al Admin Local)

## Comunicación entre Módulos

```
Admin General ──┐
                ├──> Base de Datos Central
Admin Local  ───┘

- Admin General supervisa
- Admin Local opera
- Ambos escriben en la misma BD
- Admin General tiene permisos elevados
```

## Mejores Prácticas

### Para Admin Local
1. Mantener actualizada la información del negocio
2. Revisar y gestionar citas diariamente
3. Configurar servicios claramente
4. Mantener horarios actualizados

### Para Admin General
1. Monitorear estadísticas regularmente
2. Revisar actividad reciente diariamente
3. Investigar antes de emitir advertencias
4. Documentar razones para eliminaciones
5. Generar reportes periódicos
6. Mantener auditoría de acciones

## Conclusión

- **Admin Local**: Herramienta operativa para dueños de negocios
- **Admin General**: Herramienta estratégica para supervisión del sistema

Ambos módulos son **complementarios** y trabajan juntos para mantener una plataforma saludable y funcional.
