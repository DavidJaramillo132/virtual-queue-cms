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
      return JSON.parse(user);
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
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.userActualBehavior.next(response.user);
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
        }
      })
    );
  }

  // Register
  registerUsuario(usuario: any): Observable<any> {
    console.log('Registrando usuario con datos:', usuario);
    this.loginUsuario(usuario)
    return this.http.post(`${this.apiUrl}/usuarios`, usuario);
  }

  // Logout
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.userActualBehavior.next(null);
    this.router.navigate(['/login']);
  }

  // Obtener todos los usuarios (solo para admin)
  getUsuarios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuarios`);
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
    return this.http.put<IUsuario>(`${this.apiUrl}/usuarios/${updatedUser.id}`, updatedUser, { headers }).pipe(
      tap((user: IUsuario) => {
        // Actualizar el usuario en localStorage y BehaviorSubject si es el usuario actual
        if (user.id === this.currentUserValue?.id) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.userActualBehavior.next(user);
        }
      })
    );  
} 
}