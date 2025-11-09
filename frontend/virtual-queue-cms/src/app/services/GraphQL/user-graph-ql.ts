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

interface InformePDFResponse {
  generarInformePdf: {
    success: boolean;
    pdfBase64: string;
    nombreArchivo: string;
    mensaje: string;
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

  generar_informe_pdf(): Observable<InformePDFResponse['generarInformePdf']> {
    return this.apollo.query<InformePDFResponse>({
      query: gql`
        query {
          generarInformePdf {
            success
            pdfBase64
            nombreArchivo
            mensaje
          }
        }
      `,
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data!.generarInformePdf)
    );
  }
}