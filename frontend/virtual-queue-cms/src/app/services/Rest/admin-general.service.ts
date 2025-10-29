import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

// Interfaces para AdminGeneral
export interface EstadisticasGeneralData {
  totalNegocios: number;
  negociosActivos: number;
  totalUsuarios: number;
  totalCitas: number;
  crecimiento: number;
  advertencias: number;
  negociosConAdvertencias: number;
}

export interface CategoriaNegocio {
  nombre: string;
  cantidad: number;
}

export interface ActividadReciente {
  tipo: 'nuevo_negocio' | 'advertencia' | 'usuario_eliminado';
  titulo: string;
  descripcion: string;
  tiempo: string;
}

export interface Negocio {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  tieneAdvertencia: boolean;
  fechaCreacion?: string;
  adminLocalId?: number;
}

export type RolUsuario = 'Cliente' | 'Admin Local' | 'Admin Sistema';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: RolUsuario;
  fechaRegistro: string;
}

export interface Reporte {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'negocios' | 'usuarios' | 'citas' | 'financiero';
}

@Injectable({
  providedIn: 'root'
})
export class AdminGeneralService {
  // TODO: Inyectar HttpClient cuando se conecte a la API
  // constructor(private http: HttpClient) {}

  // Endpoints de la API (configurar según tu backend)
  private readonly API_URL = 'http://localhost:3000/api'; // Cambiar según tu configuración

  // ==================== ESTADÍSTICAS GENERALES ====================
  
  /**
   * Obtiene las estadísticas generales de toda la plataforma
   * TODO: Conectar con endpoint GET /admin/estadisticas
   */
  getEstadisticasGenerales(): Observable<EstadisticasGeneralData> {
    // TODO: Implementar
    // return this.http.get<EstadisticasGeneralData>(`${this.API_URL}/admin/estadisticas`);
    
    // Mock data temporal
    return of({
      totalNegocios: 45,
      negociosActivos: 42,
      totalUsuarios: 1250,
      totalCitas: 3420,
      crecimiento: 12.5,
      advertencias: 3,
      negociosConAdvertencias: 3
    });
  }

  /**
   * Obtiene la distribución de negocios por categoría
   * TODO: Conectar con endpoint GET /admin/categorias
   */
  getCategorias(): Observable<CategoriaNegocio[]> {
    // TODO: Implementar
    // return this.http.get<CategoriaNegocio[]>(`${this.API_URL}/admin/categorias`);
    
    // Mock data temporal
    return of([
      { nombre: 'Restaurantes', cantidad: 12 },
      { nombre: 'Veterinarias', cantidad: 8 },
      { nombre: 'Hospitales', cantidad: 5 },
      { nombre: 'Salones de Belleza', cantidad: 10 },
      { nombre: 'Otros', cantidad: 10 }
    ]);
  }

  /**
   * Obtiene la actividad reciente de la plataforma
   * TODO: Conectar con endpoint GET /admin/actividad-reciente
   */
  getActividadReciente(): Observable<ActividadReciente[]> {
    // TODO: Implementar
    // return this.http.get<ActividadReciente[]>(`${this.API_URL}/admin/actividad-reciente`);
    
    // Mock data temporal
    return of([
      {
        tipo: 'nuevo_negocio',
        titulo: 'Nuevo negocio registrado',
        descripcion: 'Salón de Belleza Glamour - Hace 2 horas',
        tiempo: 'Hace 2 horas'
      },
      {
        tipo: 'advertencia',
        titulo: 'Advertencia emitida',
        descripcion: 'Restaurante El Buen Sabor - Hace 5 horas',
        tiempo: 'Hace 5 horas'
      },
      {
        tipo: 'usuario_eliminado',
        titulo: 'Usuario eliminado',
        descripcion: 'cliente@example.com - Hace 1 día',
        tiempo: 'Hace 1 día'
      }
    ]);
  }

  // ==================== GESTIÓN DE NEGOCIOS ====================
  
  /**
   * Obtiene todos los negocios de la plataforma
   * TODO: Conectar con endpoint GET /admin/negocios
   */
  getAllNegocios(): Observable<Negocio[]> {
    // TODO: Implementar
    // return this.http.get<Negocio[]>(`${this.API_URL}/admin/negocios`);
    
    // Mock data temporal
    return of([
      {
        id: 1,
        nombre: 'Restaurante El Buen Sabor',
        categoria: 'Restaurante',
        descripcion: 'Comida tradicional y deliciosa',
        direccion: 'Calle Principal 123',
        telefono: '555-0101',
        email: 'contacto@buensabor.com',
        activo: true,
        tieneAdvertencia: false
      },
      {
        id: 2,
        nombre: 'Veterinaria Patitas Felices',
        categoria: 'Veterinaria',
        descripcion: 'Cuidado integral para tus mascotas',
        direccion: 'Avenida Central 456',
        telefono: '555-0102',
        email: 'info@patitasfelices.com',
        activo: true,
        tieneAdvertencia: false
      }
    ]);
  }

  /**
   * Emite una advertencia a un negocio
   * TODO: Conectar con endpoint POST /admin/negocios/:id/advertencia
   */
  emitirAdvertencia(negocioId: number, motivo: string): Observable<void> {
    // TODO: Implementar
    // return this.http.post<void>(`${this.API_URL}/admin/negocios/${negocioId}/advertencia`, { motivo });
    
    // Mock temporal
    return of(undefined);
  }

  /**
   * Elimina un negocio de la plataforma
   * TODO: Conectar con endpoint DELETE /admin/negocios/:id
   */
  deleteNegocio(negocioId: number): Observable<void> {
    // TODO: Implementar
    // return this.http.delete<void>(`${this.API_URL}/admin/negocios/${negocioId}`);
    
    // Mock temporal
    return of(undefined);
  }

  // ==================== GESTIÓN DE USUARIOS ====================
  
  /**
   * Obtiene todos los usuarios de la plataforma
   * TODO: Conectar con endpoint GET /admin/usuarios
   */
  getAllUsuarios(rol?: RolUsuario): Observable<Usuario[]> {
    // TODO: Implementar
    // const params = rol ? `?rol=${rol}` : '';
    // return this.http.get<Usuario[]>(`${this.API_URL}/admin/usuarios${params}`);
    
    // Mock data temporal
    return of([
      {
        id: 1,
        nombre: 'María García',
        email: 'maria@example.com',
        rol: 'Cliente',
        fechaRegistro: '2024-01-10'
      },
      {
        id: 2,
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        rol: 'Admin Local',
        fechaRegistro: '2024-01-05'
      },
      {
        id: 3,
        nombre: 'Ana López',
        email: 'ana@example.com',
        rol: 'Cliente',
        fechaRegistro: '2024-01-15'
      }
    ]);
  }

  /**
   * Elimina un usuario de la plataforma
   * TODO: Conectar con endpoint DELETE /admin/usuarios/:id
   */
  deleteUsuario(usuarioId: number): Observable<void> {
    // TODO: Implementar
    // return this.http.delete<void>(`${this.API_URL}/admin/usuarios/${usuarioId}`);
    
    // Mock temporal
    return of(undefined);
  }

  // ==================== REPORTES ====================
  
  /**
   * Descarga un reporte en formato PDF o Excel
   * TODO: Conectar con endpoint GET /admin/reportes/:tipo/descargar
   */
  descargarReporte(tipoReporte: string, formato: 'pdf' | 'excel' = 'pdf'): Observable<Blob> {
    // TODO: Implementar
    // return this.http.get(`${this.API_URL}/admin/reportes/${tipoReporte}/descargar?formato=${formato}`, {
    //   responseType: 'blob'
    // });
    
    // Mock temporal
    return of(new Blob());
  }

  /**
   * Obtiene los datos para generar un reporte específico
   * TODO: Conectar con endpoint GET /admin/reportes/:tipo
   */
  getReporteData(tipoReporte: string): Observable<any> {
    // TODO: Implementar
    // return this.http.get(`${this.API_URL}/admin/reportes/${tipoReporte}`);
    
    // Mock temporal
    return of({});
  }
}
