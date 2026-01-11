import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';

// Estado global para manejar refresh en curso
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

// Interceptor funcional para Angular 17+
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);
  const apiUrl = 'http://localhost:3000/api';

  // Agregar token a las peticiones (excepto login/register/refresh)
  const token = localStorage.getItem('token');
  let authReq = req;
  
  if (token && !req.url.includes('/login') && !req.url.includes('/register') && !req.url.includes('/refresh')) {
    authReq = addTokenToRequest(req, token);
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es 401 y no es una peticion de auth, intentar refresh
      if (error.status === 401 && !req.url.includes('/login') && !req.url.includes('/refresh')) {
        return handleTokenRefresh(authReq, next, http, router, apiUrl);
      }
      return throwError(() => error);
    })
  );
};

function addTokenToRequest(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function handleTokenRefresh(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  http: HttpClient,
  router: Router,
  apiUrl: string
) {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      isRefreshing = false;
      handleLogout(router);
      return throwError(() => new Error('No refresh token available'));
    }

    return http.post<{ accessToken: string; refreshToken: string }>(`${apiUrl}/usuarios/refresh`, { refreshToken }).pipe(
      switchMap((response) => {
        isRefreshing = false;
        
        // Guardar nuevos tokens
        localStorage.setItem('token', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        
        refreshTokenSubject.next(response.accessToken);
        
        // Reintentar la peticion original con el nuevo token
        return next(addTokenToRequest(request, response.accessToken));
      }),
      catchError((err) => {
        isRefreshing = false;
        handleLogout(router);
        return throwError(() => err);
      })
    );
  } else {
    // Si ya hay un refresh en curso, esperar a que termine
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => next(addTokenToRequest(request, token!)))
    );
  }
}

function handleLogout(router: Router): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('currentUser');
  router.navigate(['/login']);
}
