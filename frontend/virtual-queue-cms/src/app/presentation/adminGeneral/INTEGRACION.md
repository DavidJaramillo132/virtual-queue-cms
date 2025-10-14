# Guía de Integración AdminGeneral con Backend

Esta guía explica cómo conectar los componentes del Panel de Administración General con tu API backend.

## 1. Configuración de Seguridad

### Implementar Guard de Autorización

```typescript
// guards/admin-general.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGeneralGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Verificar si el usuario está autenticado
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }
  
  // Verificar si tiene rol de Admin Sistema
  const userRole = authService.getUserRole();
  if (userRole === 'Admin Sistema') {
    return true;
  }
  
  // Redirigir si no tiene permisos
  router.navigate(['/unauthorized']);
  return false;
};
```

### Aplicar Guard en Routes

```typescript
// app.routes.ts
{
  path: 'admin-general',
  canActivate: [adminGeneralGuard],
  loadComponent: () =>
    import('./presentation/adminGeneral/admin-general').then(m => m.AdminGeneral)
}
```

## 2. Endpoints del Backend Requeridos

### Estadísticas Generales

```
GET /api/admin/estadisticas
Headers: Authorization: Bearer {token}
Response: {
  totalNegocios: number,
  negociosActivos: number,
  totalUsuarios: number,
  totalCitas: number,
  crecimiento: number,
  advertencias: number,
  negociosConAdvertencias: number
}

GET /api/admin/categorias
Response: Array<{
  nombre: string,
  cantidad: number
}>

GET /api/admin/actividad-reciente
Response: Array<{
  tipo: 'nuevo_negocio' | 'advertencia' | 'usuario_eliminado',
  titulo: string,
  descripcion: string,
  tiempo: string
}>
```

### Gestión de Negocios

```
GET /api/admin/negocios
Query params: ?search=texto
Response: Array<{
  id: number,
  nombre: string,
  categoria: string,
  descripcion: string,
  direccion: string,
  telefono: string,
  email: string,
  activo: boolean,
  tieneAdvertencia: boolean
}>

POST /api/admin/negocios/:id/advertencia
Body: {
  motivo: string,
  descripcion?: string
}
Response: 200 OK

DELETE /api/admin/negocios/:id
Response: 204 No Content
```

### Gestión de Usuarios

```
GET /api/admin/usuarios
Query params: ?rol=Cliente|Admin%20Local|Admin%20Sistema
Response: Array<{
  id: number,
  nombre: string,
  email: string,
  rol: string,
  fechaRegistro: string
}>

DELETE /api/admin/usuarios/:id
Response: 204 No Content
```

### Reportes

```
GET /api/admin/reportes/:tipo
Params: tipo = 'negocios' | 'usuarios' | 'citas' | 'financiero'
Response: Object con datos del reporte

GET /api/admin/reportes/:tipo/descargar
Query params: ?formato=pdf|excel
Response: Blob (archivo descargable)
Headers: Content-Type: application/pdf o application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

## 3. Actualizar el Servicio

```typescript
// admin-general.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminGeneralService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Estadísticas
  getEstadisticasGenerales(): Observable<EstadisticasGeneralData> {
    return this.http.get<EstadisticasGeneralData>(`${this.API_URL}/admin/estadisticas`);
  }

  // Negocios
  getAllNegocios(searchQuery?: string): Observable<Negocio[]> {
    let params = new HttpParams();
    if (searchQuery) {
      params = params.set('search', searchQuery);
    }
    return this.http.get<Negocio[]>(`${this.API_URL}/admin/negocios`, { params });
  }

  emitirAdvertencia(negocioId: number, motivo: string): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/admin/negocios/${negocioId}/advertencia`,
      { motivo }
    );
  }

  // ... otros métodos
}
```

## 4. Sistema de Auditoría

Todas las acciones críticas deben registrarse:

```typescript
// audit.service.ts
@Injectable({
  providedIn: 'root'
})
export class AuditService {
  constructor(private http: HttpClient) {}

  logAction(action: string, entityType: string, entityId: number, details?: any) {
    const auditLog = {
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId()
    };

    return this.http.post(`${this.API_URL}/admin/audit-log`, auditLog);
  }

  private getCurrentUserId(): number {
    // Obtener del servicio de autenticación
    return 1;
  }
}
```

Usar en los componentes:

```typescript
eliminarNegocio(negocio: Negocio) {
  if (confirm(`¿Estás seguro de eliminar "${negocio.nombre}"?`)) {
    this.adminGeneralService.deleteNegocio(negocio.id).subscribe({
      next: () => {
        // Registrar en auditoría
        this.auditService.logAction('DELETE', 'negocio', negocio.id, {
          nombre: negocio.nombre,
          categoria: negocio.categoria
        }).subscribe();

        // Actualizar lista
        this.negocios.set(this.negocios().filter(n => n.id !== negocio.id));
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        alert('Error al eliminar el negocio');
      }
    });
  }
}
```

## 5. Manejo de Errores

```typescript
// error-handler.service.ts
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  handleError(error: any, context: string) {
    console.error(`Error en ${context}:`, error);

    let message = 'Ha ocurrido un error';

    if (error.status === 403) {
      message = 'No tienes permisos para realizar esta acción';
    } else if (error.status === 404) {
      message = 'El recurso no fue encontrado';
    } else if (error.status === 500) {
      message = 'Error del servidor. Intenta nuevamente más tarde';
    } else if (error.error?.message) {
      message = error.error.message;
    }

    // Mostrar notificación al usuario
    alert(message);
  }
}
```

## 6. Confirmaciones de Seguridad

Para acciones críticas, implementar confirmación doble:

```typescript
async confirmarAccionCritica(mensaje: string): Promise<boolean> {
  const confirmacion1 = confirm(mensaje);
  if (!confirmacion1) return false;

  const confirmacion2 = confirm('¿Estás completamente seguro? Esta acción no se puede deshacer.');
  return confirmacion2;
}

async eliminarNegocio(negocio: Negocio) {
  const confirmado = await this.confirmarAccionCritica(
    `¿Eliminar el negocio "${negocio.nombre}"?`
  );

  if (confirmado) {
    // Proceder con la eliminación
  }
}
```

## 7. Paginación

Para listas grandes, implementar paginación:

```typescript
// Componente
pageSize = signal<number>(10);
currentPage = signal<number>(1);
totalPages = signal<number>(1);

cargarNegocios() {
  this.adminGeneralService.getAllNegocios(
    this.currentPage(),
    this.pageSize()
  ).subscribe(response => {
    this.negocios.set(response.data);
    this.totalPages.set(response.totalPages);
  });
}

// Template
<div class="flex justify-between items-center mt-6">
  <button 
    (click)="currentPage.set(currentPage() - 1); cargarNegocios()"
    [disabled]="currentPage() === 1"
    class="px-4 py-2 bg-black text-white rounded-lg disabled:bg-gray-300">
    Anterior
  </button>
  <span>Página {{ currentPage() }} de {{ totalPages() }}</span>
  <button 
    (click)="currentPage.set(currentPage() + 1); cargarNegocios()"
    [disabled]="currentPage() === totalPages()"
    class="px-4 py-2 bg-black text-white rounded-lg disabled:bg-gray-300">
    Siguiente
  </button>
</div>
```

## 8. Descarga de Reportes

```typescript
descargarReporte(reporte: Reporte) {
  this.adminGeneralService.descargarReporte(reporte.id, 'pdf').subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reporte.titulo}_${new Date().toISOString()}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err) => {
      console.error('Error al descargar:', err);
      alert('Error al descargar el reporte');
    }
  });
}
```

## 9. WebSockets para Actividad en Tiempo Real

```typescript
// websocket.service.ts
@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket;

  connect(url: string) {
    this.socket = new WebSocket(url);

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Emitir evento
      this.activitySubject.next(data);
    };
  }

  // Usar en componente de estadísticas
  ngOnInit() {
    this.wsService.activityUpdates$.subscribe(activity => {
      // Actualizar actividad reciente
      this.actividadReciente.set([activity, ...this.actividadReciente()]);
    });
  }
}
```

## 10. Testing

```typescript
// negocios.component.spec.ts
describe('NegociosComponent', () => {
  let component: NegociosComponent;
  let service: AdminGeneralService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NegociosComponent, HttpClientTestingModule],
      providers: [AdminGeneralService]
    });

    component = TestBed.createComponent(NegociosComponent).componentInstance;
    service = TestBed.inject(AdminGeneralService);
  });

  it('should load negocios on init', () => {
    spyOn(service, 'getAllNegocios').and.returnValue(of([...]));
    component.ngOnInit();
    expect(component.negocios().length).toBeGreaterThan(0);
  });
});
```

## Checklist de Implementación

- [ ] Implementar guards de autorización
- [ ] Configurar HttpClient y interceptores
- [ ] Implementar todos los endpoints en el backend
- [ ] Descomentar métodos HTTP en el servicio
- [ ] Agregar sistema de auditoría
- [ ] Implementar manejo de errores global
- [ ] Agregar confirmaciones para acciones críticas
- [ ] Implementar paginación
- [ ] Configurar descarga de reportes
- [ ] Agregar WebSockets para actualizaciones en tiempo real
- [ ] Implementar tests unitarios
- [ ] Probar cada funcionalidad
- [ ] Configurar variables de entorno
- [ ] Documentar API endpoints
