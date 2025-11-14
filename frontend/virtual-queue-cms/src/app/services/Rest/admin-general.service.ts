import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';

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

export interface Negocio {
  id: number | string;
  nombre: string;
  categoria: string;
  descripcion: string;
  direccion: string;
  telefono: string;
  email: string;
  activo: boolean;
  tieneAdvertencia: boolean;
  fechaCreacion?: string;
  adminLocalId?: number | string;
}

export type RolUsuario = 'Cliente' | 'Admin Local' | 'Admin Sistema';

export interface Usuario {
  id: number | string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  fechaRegistro: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminGeneralService {
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene los headers de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // ==================== ESTADÍSTICAS GENERALES ====================
  
  /**
   * Obtiene las estadísticas generales de toda la plataforma
   */
  getEstadisticasGenerales(): Observable<EstadisticasGeneralData> {
    const headers = this.getAuthHeaders();
    return this.http.get<EstadisticasGeneralData>(`${this.API_URL}/admin/estadisticas`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo estadísticas:', error);
          // Retornar datos por defecto en caso de error
          return of({
            totalNegocios: 0,
            negociosActivos: 0,
            totalUsuarios: 0,
            totalCitas: 0,
            crecimiento: 0,
            advertencias: 0,
            negociosConAdvertencias: 0
          });
        })
      );
  }

  /**
   * Obtiene la distribución de negocios por categoría
   */
  getCategorias(): Observable<CategoriaNegocio[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<CategoriaNegocio[]>(`${this.API_URL}/admin/categorias`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error obteniendo categorías:', error);
          return of([]);
        })
      );
  }


  // ==================== GESTIÓN DE NEGOCIOS ====================
  
  /**
   * Obtiene todos los negocios de la plataforma
   */
  getAllNegocios(searchQuery?: string): Observable<Negocio[]> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    if (searchQuery) {
      params = params.set('search', searchQuery);
    }
    
    return this.http.get<any[]>(`${this.API_URL}/negocios`, { headers, params })
      .pipe(
        map(negocios => negocios.map(negocio => this.mapNegocioFromBackend(negocio))),
        catchError(error => {
          console.error('Error obteniendo negocios:', error);
          return of([]);
        })
      );
  }

  /**
   * Obtiene un negocio por su ID
   */
  getNegocioById(negocioId: number | string): Observable<Negocio> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API_URL}/negocios/${negocioId}`, { headers })
      .pipe(
        map(negocio => this.mapNegocioFromBackend(negocio)),
        catchError(error => {
          console.error('Error obteniendo negocio:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Mapea un negocio del backend al formato del frontend
   */
  private mapNegocioFromBackend(negocio: any): Negocio {
    return {
      id: negocio.id, // Mantener como string (UUID) o número según el backend
      nombre: negocio.nombre || '',
      categoria: negocio.categoria || 'Sin categoría',
      descripcion: negocio.descripcion || '',
      direccion: negocio.direccion || '',
      telefono: negocio.telefono || '',
      email: negocio.correo || negocio.email || '',
      activo: negocio.estado !== undefined ? negocio.estado : (negocio.activo !== undefined ? negocio.activo : true),
      tieneAdvertencia: false,
      fechaCreacion: negocio.creado_en || negocio.fecha_creacion || negocio.fechaCreacion,
      adminLocalId: negocio.admin_negocio_id || negocio.adminLocalId
    };
  }

  /**
   * Elimina un negocio de la plataforma
   */
  deleteNegocio(negocioId: number | string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.API_URL}/negocios/${negocioId}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error eliminando negocio:', error);
          return throwError(() => error);
        })
      );
  }

  // ==================== GESTIÓN DE USUARIOS ====================
  
  /**
   * Obtiene todos los usuarios de la plataforma
   */
  getAllUsuarios(rol?: RolUsuario): Observable<Usuario[]> {
    const headers = this.getAuthHeaders();
    let params = new HttpParams();
    if (rol) {
      params = params.set('rol', rol);
    }
    
    return this.http.get<any[]>(`${this.API_URL}/usuarios`, { headers, params })
      .pipe(
        map(usuarios => usuarios.map(usuario => this.mapUsuarioFromBackend(usuario))),
        catchError(error => {
          console.error('Error obteniendo usuarios:', error);
          return of([]);
        })
      );
  }

  /**
   * Mapea un usuario del backend al formato del frontend
   */
  private mapUsuarioFromBackend(usuario: any): Usuario {
    // Formatear fecha de creación
    let fechaRegistro = new Date().toISOString().split('T')[0];
    if (usuario.creado_en) {
      const fecha = new Date(usuario.creado_en);
      fechaRegistro = fecha.toISOString().split('T')[0];
    } else if (usuario.created_at) {
      const fecha = new Date(usuario.created_at);
      fechaRegistro = fecha.toISOString().split('T')[0];
    } else if (usuario.fecha_registro) {
      fechaRegistro = usuario.fecha_registro;
    }

    return {
      id: usuario.id, // Mantener como string (UUID) o número según el backend
      nombre: usuario.nombre_completo || usuario.nombre || '',
      email: usuario.email || '',
      rol: this.mapRolFromBackend(usuario.rol),
      fechaRegistro
    };
  }

  /**
   * Mapea el rol del backend al formato del frontend
   */
  private mapRolFromBackend(rol: string): RolUsuario {
    const rolLower = rol?.toLowerCase() || '';
    if (rolLower === 'admin_sistema' || rolLower === 'admin sistema') {
      return 'Admin Sistema';
    }
    if (rolLower === 'negocio' || rolLower === 'admin_local' || rolLower === 'admin local') {
      return 'Admin Local';
    }
    return 'Cliente';
  }

  /**
   * Elimina un usuario de la plataforma
   */
  deleteUsuario(usuarioId: number | string): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.API_URL}/usuarios/${usuarioId}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error eliminando usuario:', error);
          return throwError(() => error);
        })
      );
  }

}
