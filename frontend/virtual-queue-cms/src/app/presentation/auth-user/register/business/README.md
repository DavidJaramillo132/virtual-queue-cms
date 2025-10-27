# Componente Business - Formulario de Registro de Negocios

## Descripción
Este componente se muestra dinámicamente cuando un usuario selecciona el rol "Negocio" durante el registro. Permite recopilar información adicional necesaria para crear un negocio en la plataforma.

## Campos del Formulario

### Obligatorios (*)
- **Nombre del Negocio**: Mínimo 3 caracteres
- **Categoría**: Selección de una lista predefinida
  - Restaurante
  - Salud
  - Educación
  - Entretenimiento
  - Tecnología
  - Belleza
  - Servicios
  - Otro
- **Descripción**: Mínimo 10 caracteres, descripción detallada del negocio
- **Teléfono del Negocio**: Formato válido (10-15 dígitos)
- **Correo del Negocio**: Email válido

### Opcionales
- **URL de Imagen**: URL de la imagen del negocio (puede agregarse después)

## Funcionamiento

1. El componente recibe el `FormGroup` padre desde el componente `Register`
2. Crea su propio `FormGroup` interno llamado `businessForm`
3. Se registra como un control hijo en el formulario padre con el nombre `negocio`
4. Cuando el componente se destruye, se elimina automáticamente del formulario padre
5. Las validaciones se aplican en tiempo real

## Integración con el Backend

Cuando se envía el formulario completo:

1. **Se crea el usuario** con el rol "Negocio"
2. **Se crea el negocio** asociado al usuario recién creado mediante el campo `admin_negocio_id`
3. **Se realiza login automático** después del registro exitoso
4. **Se redirige al home** de la aplicación

### Estructura de datos enviada al backend

```typescript
// Usuario
{
  nombreCompleto: string,
  email: string,
  password: string,
  rol: "Negocio",
  telefono: string
}

// Negocio (después de crear el usuario)
{
  nombre: string,
  categoria: string,
  descripcion: string,
  telefono: string,
  correo: string,
  imagen_url: string,
  admin_negocio_id: string, // UUID del usuario
  estado: true
}
```

## Validaciones

- Todos los campos obligatorios deben completarse
- El email debe tener formato válido
- El teléfono debe tener entre 10-15 dígitos
- El nombre debe tener al menos 3 caracteres
- La descripción debe tener al menos 10 caracteres
- Se debe seleccionar una categoría

## Estilos

El componente utiliza Tailwind CSS para los estilos:
- Fondo gris claro (`bg-gray-50`)
- Borde azul primario (`border-primary`)
- Focus ring azul cielo (`focus:ring-sky-300`)
- Responsive design con grid

## Uso en el componente padre

```html
<app-business 
  *ngIf="showBusinessForm" 
  [parentForm]="registerForm"
></app-business>
```

La variable `showBusinessForm` se actualiza automáticamente cuando el usuario selecciona el rol "Negocio".
