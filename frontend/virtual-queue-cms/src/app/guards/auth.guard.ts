import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { UserService } from '../services/Rest/userServices';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Si no está autenticado, redirige a /login
    if (!this.userService.isAuthenticated()) {
      return this.router.parseUrl('/login');
    }

    const roles = route.data['roles'] as string[] | undefined;
    if (roles && roles.length > 0) {
      if (!this.userService.hasAnyRole(roles)) {
        // No autorizado para este rol
        return this.router.parseUrl('/welcome');
      }
    }

    // Verificación de propiedad: opcional, permite proteger rutas como /business/:id
    const ownership = route.data['ownership'] as { param?: string } | undefined;
    if (ownership?.param) {
      const paramVal = route.paramMap.get(ownership.param);
      const user = this.userService.currentUserValue;
      if (!user) return this.router.parseUrl('/login');

      // Si el usuario es administrador del sistema, permitir
      if (this.userService.hasAnyRole(['admin_sistema'])) {
        return true;
      }

      // Si el usuario tiene negocio_id y coincide con el parámetro de la ruta, permitir
      if (user.negocio_id && paramVal && user.negocio_id === paramVal) {
        return true;
      }

      // No permitido
      return this.router.parseUrl('/welcome');
    }

    // Permitir por defecto
    return true;
  }
}
