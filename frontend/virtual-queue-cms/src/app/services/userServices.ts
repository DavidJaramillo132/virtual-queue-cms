import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class userService {
  private apiUrl = 'http://localhost:3000/api';
  private userActualBehavior: BehaviorSubject<any> = new BehaviorSubject<any>(
    this.getUserFromStorage()
  );
  public userActual$: Observable<any> = this.userActualBehavior.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // Obtener usuario del localStorage al iniciar
  private getUserFromStorage(): any {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
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
        // Guardar usuario en localStorage y actualizar BehaviorSubject
        if (response && response.usuario) {
          localStorage.setItem('currentUser', JSON.stringify(response.usuario));
          this.userActualBehavior.next(response.usuario);
          
          // Opcional: guardar token si lo usas
          if (response.token) {
            localStorage.setItem('token', response.token);
          }
        }
      })
    );
  }

  // Register
  registerUsuario(usuario: any): Observable<any> {
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
}