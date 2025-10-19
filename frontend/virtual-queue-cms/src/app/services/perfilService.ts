// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, BehaviorSubject } from 'rxjs';
// import { tap } from 'rxjs/operators';
// import { IUsuario } from '../domain/entities';

// @Injectable({ providedIn: 'root' })
// export class PerfilService {
//   private apiUrl = 'http://localhost:3000/api';
//   private profileSubject = new BehaviorSubject<IUsuario | null>(this.getProfileFromStorage());
//   public profile$ = this.profileSubject.asObservable();

//   constructor(private http: HttpClient) {}

//   /**
//    * Obtiene el perfil del localStorage
//    */
//   private getProfileFromStorage(): IUsuario | null {
//     const profile = localStorage.getItem('IUsuario');
    
//     if (!profile || profile === 'undefined') {
//       return null;
//     }

//     try {
//       return JSON.parse(profile);
//     } catch (error) {
//       console.error('Error al parsear IUsuario:', error);
//       localStorage.removeItem('IUsuario');
//       return null;
//     }
//   }

//   /**
//    * Obtiene el perfil actual del usuario
//    */
//   getCurrentProfile(): IUsuario | null {
//     return this.profileSubject.value;
//   }




//   /**
//    * Convierte el código del rol a un nombre legible
//    */
//   private getRoleName(rol: string): string {
//     const roles: { [key: string]: string } = {
//       'cliente': 'Cliente',
//       'Negocio': 'Administrador de Negocio',
//       'AdminGeneral': 'Administrador del Sistema'
//     };
//     return roles[rol] || rol;
//   }

//   /**
//    * Limpia los datos del perfil
//    */
//   clearProfile(): void {
//     localStorage.removeItem('IUsuario');
//     this.profileSubject.next(null);
//   }



// }
