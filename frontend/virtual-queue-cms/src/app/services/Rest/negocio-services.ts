import { Injectable } from '@angular/core';
import { INegocio, IServicio } from '../../domain/entities';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class NegocioServices {

  private apiUrl = 'http://localhost:3000/api/negocios'; // URL de la API

  constructor(private http: HttpClient, private router: Router) { }

  getNegocios(): Observable<INegocio[]> {
    return this.http.get(this.apiUrl) as Observable<INegocio[]>;
  }

  getNegocioById(id: string): Observable<INegocio> {
    return this.http.get(`${this.apiUrl}/${id}`) as Observable<INegocio>;
  }

  getServiciosByNegocio(negocioId: string): Observable<IServicio[]> {
    return this.http.get(`http://localhost:3000/api/servicios?negocioId=${negocioId}`) as Observable<IServicio[]>;
  }

  // Crear un nuevo negocio
  createNegocio(negocioData: any): Observable<INegocio> {
    return this.http.post(this.apiUrl, negocioData) as Observable<INegocio>;
  }
}
