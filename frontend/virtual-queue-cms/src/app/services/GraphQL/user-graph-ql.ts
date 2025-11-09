import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PerfilCompletoResponse {
  perfilCompletoUsuario: {
    id: string;
    nombreCompleto: string;
    email: string;
    telefono?: string;
    totalCitas: number;
    citasCompletadas: number;
    citasPendientes: number;
    citasCanceladas: number;
  };
}


@Injectable({
  providedIn: 'root'
})
export class UserGraphQl {
  private PATH = "/graphql";
  private HOST = "http://localhost:3001";
  //private fullUrl = this.HOST + this.PATH;

  constructor(private apollo: Apollo) { }

  perfil_completo_usuario() {
    return this.apollo.watchQuery<PerfilCompletoResponse>({
      query: gql`
      query {
        perfilCompletoUsuario {
          id
          nombreCompleto
          email
          telefono
          totalCitas
          citasCompletadas
          citasPendientes
          citasCanceladas
        }
      }
    `, fetchPolicy: 'network-only'
    }).valueChanges;
  }
}