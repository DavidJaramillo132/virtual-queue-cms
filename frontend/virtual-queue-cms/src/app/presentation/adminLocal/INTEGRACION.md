# Guía de Integración con Backend

Esta guía explica cómo conectar los componentes del Panel de Administración con tu API backend.

## 1. Configuración Inicial

### Habilitar HttpClient en la aplicación

En `app.config.ts`:

```typescript
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(), // Agregar esta línea
    // ... otros providers
  ]
};
```

## 2. Actualizar el Servicio

### Modificar `admin-local.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminLocalService {
  private readonly API_URL = 'http://localhost:3000/api'; // Tu URL del backend

  constructor(private http: HttpClient) {}

  // Ejemplo de método actualizado:
  getEstadisticas(negocioId: number): Observable<EstadisticasData> {
    return this.http.get<EstadisticasData>(`${this.API_URL}/estadisticas/${negocioId}`);
  }

  // Repetir para todos los métodos...
}
```

## 3. Usar el Servicio en los Componentes

### Ejemplo: Componente de Estadísticas

```typescript
import { Component, OnInit, signal } from '@angular/core';
import { AdminLocalService } from '../../../services/admin-local.service';

@Component({
  selector: 'app-estadisticas',
  // ...
})
export class EstadisticasComponent implements OnInit {
  estadisticas = signal<EstadisticasData>({} as EstadisticasData);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor(private adminService: AdminLocalService) {}

  ngOnInit() {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.loading.set(true);
    const negocioId = 1; // Obtener del contexto/sesión del usuario

    this.adminService.getEstadisticas(negocioId).subscribe({
      next: (data) => {
        this.estadisticas.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar estadísticas');
        this.loading.set(false);
        console.error(err);
      }
    });
  }
}
```

## 4. Endpoints del Backend Requeridos

### Estadísticas
```
GET /api/estadisticas/:negocioId
Response: {
  totalCitas: number,
  citasHoy: number,
  tiempoEspera: number,
  satisfaccion: number,
  citasCompletadas: number,
  citasCanceladas: number,
  nuevosClientes: number
}
```

### Negocio
```
GET /api/negocio/:id
Response: {
  id: number,
  nombre: string,
  categoria: string,
  descripcion: string,
  direccion: string,
  telefono: string,
  email: string
}

PUT /api/negocio/:id
Body: NegocioData
Response: NegocioData actualizado
```

### Servicios
```
GET /api/servicios?negocioId=:id
Response: Servicio[]

POST /api/servicios
Body: {
  nombre: string,
  descripcion: string,
  duracion: number,
  precio?: number,
  activo: boolean,
  negocioId: number
}
Response: Servicio creado

PUT /api/servicios/:id
Body: Servicio
Response: Servicio actualizado

DELETE /api/servicios/:id
Response: 204 No Content
```

### Horarios
```
GET /api/horarios?negocioId=:id
Response: DiaHorario[]

PUT /api/horarios/:negocioId
Body: DiaHorario[]
Response: DiaHorario[] actualizado
```

### Citas
```
GET /api/citas?negocioId=:id&estado=:estado
Response: Cita[]

PATCH /api/citas/:id/estado
Body: { estado: string }
Response: Cita actualizada

DELETE /api/citas/:id
Response: 204 No Content
```

## 5. Manejo de Autenticación

Si tu API requiere autenticación, crea un interceptor:

```typescript
// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token'); // O desde un servicio de auth

  if (token) {
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }

  return next(req);
};
```

Registrar en `app.config.ts`:

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    // ...
  ]
};
```

## 6. Manejo de Errores Global

```typescript
// error.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Redirigir al login
        window.location.href = '/login';
      }
      
      console.error('Error HTTP:', error);
      return throwError(() => error);
    })
  );
};
```

## 7. Variables de Entorno

Crear `environment.ts` y `environment.prod.ts`:

```typescript
// environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};

// environment.prod.ts (producción)
export const environment = {
  production: true,
  apiUrl: 'https://api.tudominio.com/api'
};
```

Usar en el servicio:

```typescript
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminLocalService {
  private readonly API_URL = environment.apiUrl;
  // ...
}
```

## 8. Loading States en Templates

Actualizar templates para mostrar estados de carga:

```html
<div class="space-y-6">
  @if (loading()) {
    <div class="flex justify-center items-center p-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  } @else if (error()) {
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ error() }}</p>
    </div>
  } @else {
    <!-- Contenido normal -->
  }
</div>
```

## 9. Mapeo de Entidades del Backend

Si las entidades del backend usan nombres diferentes, crea mappers:

```typescript
// mappers/negocio.mapper.ts
export class NegocioMapper {
  static fromAPI(data: any): NegocioData {
    return {
      id: data.id,
      nombre: data.name,
      categoria: data.category,
      descripcion: data.description,
      direccion: data.address,
      telefono: data.phone,
      email: data.email
    };
  }

  static toAPI(data: NegocioData): any {
    return {
      name: data.nombre,
      category: data.categoria,
      description: data.descripcion,
      address: data.direccion,
      phone: data.telefono,
      email: data.email
    };
  }
}
```

## 10. Testing

Ejemplo de test para un componente:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EstadisticasComponent } from './estadisticas';

describe('EstadisticasComponent', () => {
  let component: EstadisticasComponent;
  let fixture: ComponentFixture<EstadisticasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadisticasComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(EstadisticasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Checklist de Integración

- [ ] Habilitar HttpClient en app.config
- [ ] Configurar URL de la API
- [ ] Implementar todos los endpoints en el backend
- [ ] Descomentar métodos HTTP en el servicio
- [ ] Agregar manejo de errores
- [ ] Implementar loading states
- [ ] Configurar autenticación si es necesario
- [ ] Probar cada funcionalidad
- [ ] Agregar validaciones de formularios
- [ ] Implementar notificaciones al usuario
