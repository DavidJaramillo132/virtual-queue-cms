import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { IUsuario } from '../../domain/entities';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = 'http://localhost:3000/api';
  private userActualBehavior: BehaviorSubject<any> = new BehaviorSubject<any>(
    this.getUserFromStorage()
  );
  public userActual: Observable<any> = this.userActualBehavior.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  // Obtener usuario del localStorage al iniciar
  private getUserFromStorage(): any {
    const user = localStorage.getItem('currentUser');

    // Previene errores si el valor es null o el texto "undefined"
    if (!user || user === 'undefined') {
      return null;
    }

    try {
      const parsedUser = JSON.parse(user);
      // Normalizar nombreCompleto a nombre_completo si es necesario
      if (parsedUser && parsedUser.nombreCompleto && !parsedUser.nombre_completo) {
        parsedUser.nombre_completo = parsedUser.nombreCompleto;
      }
      
      // Normalizar creado_en a creadoEn si es necesario
      if (parsedUser && parsedUser.creado_en && !parsedUser.creadoEn) {
        parsedUser.creadoEn = parsedUser.creado_en;
      }
      
      // Convertir creadoEn a Date si es un string
      if (parsedUser && parsedUser.creadoEn && typeof parsedUser.creadoEn === 'string') {
        parsedUser.creadoEn = new Date(parsedUser.creadoEn);
      }
      
      return parsedUser;
    } catch (error) {
      console.error('Error al parsear currentUser:', error);
      // Limpia el valor inválido del localStorage
      localStorage.removeItem('currentUser');
      return null;
    }
  }


  // Getter para obtener el valor actual del usuario
  get currentUserValue(): any {
    return this.userActualBehavior.value;
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  // Obtener el rol del usuario actual
  getUserRole(): string | null {
    return this.currentUserValue?.rol || this.currentUserValue?.role || null;
  }

  // Login
  loginUsuario(credentials: any): Observable<any> {
    console.log('Enviando credenciales al backend:', credentials);
    return this.http.post(`${this.apiUrl}/usuarios/login`, credentials).pipe(
      tap((response: any) => {
        // Guardar usuario en localStorage y actualizar BehaviorSubjects
        console.log('Respuesta recibida del backend:', response);
        if (response.successful) {
          // Mapear nombreCompleto a nombre_completo para consistencia
          const user = response.user;
          if (user.nombreCompleto && !user.nombre_completo) {
            user.nombre_completo = user.nombreCompleto;
          }
          
          // Mapear creado_en a creadoEn si es necesario
          if (user.creado_en && !user.creadoEn) {
            user.creadoEn = user.creado_en;
          } else if (!user.creadoEn && !user.creado_en) {
            // Si no hay fecha, usar la fecha actual como fallback
            user.creadoEn = new Date();
          }
          
          // Asegurar que creadoEn sea una fecha válida (se guarda como string en JSON)
          if (user.creadoEn) {
            const fecha = user.creadoEn instanceof Date ? user.creadoEn : new Date(user.creadoEn);
            if (!isNaN(fecha.getTime())) {
              user.creadoEn = fecha.toISOString(); // Guardar como ISO string para JSON
            }
          }
          
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.userActualBehavior.next(user);
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
          // Guardar refresh token para renovacion automatica
          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
          }
        }
      })
    );
  }

  // Register
  registerUsuario(usuario: any): Observable<any> {
    console.log('Registrando usuario con datos:', usuario);
    // Asegurar que el campo sea nombre_completo (no nombre_completo)
    if (usuario.nombre_completo && !usuario.nombre_completo) {
      usuario.nombre_completo = usuario.nombre_completo;
      delete usuario.nombre_completo;
    }
    return this.http.post(`${this.apiUrl}/usuarios`, usuario);
  }

  // Logout - revoca tokens en el backend antes de limpiar localStorage
  logout(): void {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Llamar al backend para revocar tokens (fire-and-forget)
    if (token || refreshToken) {
      this.http.post(`${this.apiUrl}/usuarios/logout`, {
        accessToken: token,
        refreshToken: refreshToken
      }).subscribe({
        next: () => console.log('Tokens revocados correctamente'),
        error: (err) => console.warn('Error al revocar tokens:', err)
      });
    }
    
    // Limpiar localStorage inmediatamente
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.userActualBehavior.next(null);
    this.router.navigate(['/login']);
  }

  // Obtener todos los usuarios (solo para admin)
  getUsuarios(): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
    return this.http.get(`${this.apiUrl}/usuarios`, { headers });
  }

  // Verificar si el usuario tiene un rol específico
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  // Verificar si el usuario tiene alguno de los roles especificados
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.getUserRole();
    return userRole ? roles.includes(userRole) : false;
  }

  // Actualizar usuario
  actualizarUsuario(updatedUser: IUsuario): Observable<IUsuario> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    
    // Asegurar que el backend reciba nombre_completo (el backend espera nombre_completo)
    const userToUpdate = {
      ...updatedUser,
      nombre_completo: updatedUser.nombre_completo || (updatedUser as any).nombreCompleto
    };
    
    return this.http.put<IUsuario>(`${this.apiUrl}/usuarios/${updatedUser.id}`, userToUpdate, { headers }).pipe(
      tap((user: IUsuario) => {
        // Normalizar la respuesta del backend
        if ((user as any).nombreCompleto && !user.nombre_completo) {
          (user as any).nombre_completo = (user as any).nombreCompleto;
        }
        
        // Normalizar creado_en a creadoEn si es necesario
        if ((user as any).creado_en && !user.creadoEn) {
          (user as any).creadoEn = (user as any).creado_en;
        }
        
        // Convertir creadoEn a Date si es un string
        if ((user as any).creadoEn && typeof (user as any).creadoEn === 'string') {
          (user as any).creadoEn = new Date((user as any).creadoEn);
        }
        
        // Actualizar el usuario en localStorage y BehaviorSubject si es el usuario actual
        if (user.id === this.currentUserValue?.id) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.userActualBehavior.next(user);
        }
      })
    );
  }

  // Descargar informe PDF del perfil del usuario
  descargarInformePDF(): Observable<Blob> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    
    return this.http.get(`${this.apiUrl}/usuarios/informe-pdf`, {
      headers,
      responseType: 'blob' // Importante para recibir el archivo PDF
    });
  }

  
}
