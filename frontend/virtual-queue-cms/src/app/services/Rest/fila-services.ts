import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ICita } from '../../domain/entities';

@Injectable({ providedIn: 'root' })
export class FilasService {
  private apiUrl = 'http://localhost:3000/api/citas';

  constructor(private http: HttpClient) {}

  getCitas(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http.get<any[]>(this.apiUrl, { headers });
  }

  agregarCita(cita: ICita): Observable<ICita> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    
    console.log('Agregar cita llamada con datos:', cita);
    
    // Enviar el objeto directamente, sin envolverlo en { cita }
    return this.http.post<ICita>(this.apiUrl, cita, { headers });
  }
}
