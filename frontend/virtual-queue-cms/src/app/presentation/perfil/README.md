# Componente de Perfil de Usuario

## Descripción
Componente standalone de Angular que permite a los usuarios visualizar y editar su información de perfil personal.

## Características

### 🎨 Diseño
- Interfaz moderna con Tailwind CSS
- Responsive (mobile-first)
- Modo de edición in-place
- Iconos SVG integrados
- Transiciones y animaciones suaves

### 📋 Funcionalidades
- **Visualización de Perfil**: Muestra toda la información del usuario
- **Edición de Perfil**: Permite modificar datos personales
- **Persistencia Local**: Guarda cambios en localStorage
- **Validación**: Campos editables con feedback visual
- **Navegación**: Botón para volver a la página anterior

## Datos Gestionados

### Información Personal
- Nombre completo (nombre + apellido)
- Correo electrónico
- Teléfono
- Dirección
- Biografía

### Información de la Cuenta
- Tipo de usuario (rol)
- Fecha de registro

## Almacenamiento

El componente utiliza dos fuentes de datos en localStorage:

1. **`currentUser`**: Datos básicos del usuario autenticado (gestionado por `userService`)
2. **`userProfile`**: Perfil completo con información adicional

## Uso

### 1. Importar en las rutas
```typescript
import { PerfilComponent } from './presentation/perfil/perfil';

const routes: Routes = [
  {
    path: 'perfil',
    component: PerfilComponent
  }
];
```

### 2. Navegación desde otros componentes
```typescript
this.router.navigate(['/perfil']);
```

### 3. En el template
```html
<a routerLink="/perfil">Mi Perfil</a>
```

## Estructura de Archivos

```
perfil/
├── perfil.ts          # Componente TypeScript
├── perfil.html        # Template HTML
├── perfil.css         # Estilos adicionales
└── README.md          # Este archivo
```

## Dependencias

- `@angular/common` - CommonModule
- `@angular/forms` - FormsModule (para ngModel)
- `@angular/router` - Router
- `userService` - Servicio de autenticación y usuario

## Modo de Edición

1. Click en "Editar Perfil"
2. Los campos se convierten en inputs editables
3. Modificar la información deseada
4. Click en "Guardar" para confirmar o "Cancelar" para descartar

## Flujo de Datos

```
localStorage (currentUser)
    ↓
userService.currentUserValue
    ↓
PerfilComponent.loadUserProfile()
    ↓
localStorage (userProfile)
    ↓
Visualización/Edición
    ↓
Guardar cambios
    ↓
Actualizar localStorage (currentUser + userProfile)
```

## Integración Backend (Futuro)

Para conectar con el backend, descomentar y completar el método `saveProfile()`:

```typescript
saveProfile(): void {
  // ... código actual ...
  
  // Agregar llamada al backend
  this.userService.updateProfile(this.userProfile).subscribe(
    response => {
      console.log('Perfil actualizado en el servidor');
    },
    error => {
      console.error('Error al actualizar perfil:', error);
      // Revertir cambios si falla
    }
  );
}
```

## Personalización

### Cambiar Estilos
Modificar las clases de Tailwind en `perfil.html` o agregar CSS personalizado en `perfil.css`.

### Agregar Campos
1. Actualizar interfaz `UserProfile` en `perfil.ts`
2. Agregar campo en el template `perfil.html`
3. Incluir en los métodos `loadUserProfile()` y `saveProfile()`

### Validaciones
Para agregar validaciones, considerar usar `ReactiveFormsModule` en lugar de `FormsModule`.

## Seguridad

- ⚠️ Los datos se almacenan en localStorage (no es seguro para información sensible)
- ✅ El componente verifica autenticación antes de cargar
- ✅ Redirección automática a login si no hay usuario autenticado
- 🔒 Para producción, implementar validación en el backend

## Testing

### Casos de Prueba
- [ ] Carga correcta del perfil desde localStorage
- [ ] Redirección a login si no hay usuario autenticado
- [ ] Modo edición activa/desactiva correctamente
- [ ] Guardado actualiza localStorage
- [ ] Cancelación restaura valores originales
- [ ] Formato de fecha se muestra correctamente
- [ ] Navegación hacia atrás funciona

## Mejoras Futuras

- [ ] Subida de foto de perfil
- [ ] Cambio de contraseña
- [ ] Validación de formularios con Reactive Forms
- [ ] Confirmación antes de guardar cambios
- [ ] Notificaciones toast al guardar
- [ ] Conexión con API backend
- [ ] Manejo de errores mejorado
- [ ] Carga asíncrona de datos del servidor
- [ ] Caché y sincronización online/offline

## Notas

- Componente standalone (no requiere módulo)
- Compatible con Angular 14+
- Requiere Tailwind CSS configurado en el proyecto
