import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { IServicio } from '../../domain/entities';

@Injectable({
  providedIn: 'root'
})
export class ServicioServicios {
  private apiUrl = 'http://localhost:3000/api/servicios';

  constructor(private http: HttpClient, private router: Router) {}

  getServiciosByNegocio(negocioId: string): Observable<IServicio[]> {
    return this.http.get<IServicio[]>(`${this.apiUrl}?negocioId=${negocioId}`);
  }

  agregarServicio(servicio: IServicio): Observable<IServicio> {
    return this.http.post<IServicio>(this.apiUrl, servicio).pipe(
      tap(() => this.router.navigate(['/servicios']))
    );
  }
}
