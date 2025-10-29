import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UserGraphQl {
  private PATH = "/graphql";
  private HOST = "http://localhost:3001";
  private fullUrl = this.HOST + this.PATH;

  constructor(private apollo: Apollo) { }

  perfil_completo_usuario(correo: string): Observable<any> {
    return this.apollo.watchQuery({
      query: gql`
      query PerfilCompletoUsuario($correo: String!) {
        perfilCompletoUsuario(usuarioId: $correo) {
          totalCitas
          citasCompletadas
          citasPendientes
          citasCanceladas
        }
      }
    `,
      variables: {
        correo: correo
      }
    }).valueChanges; 
  }


}
