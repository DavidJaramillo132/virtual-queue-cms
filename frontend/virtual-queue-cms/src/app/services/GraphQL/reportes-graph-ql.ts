import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface InformePDFResponse {
  success: boolean;
  pdfBase64: string;
  nombreArchivo: string;
  mensaje: string;
}

interface ReporteServiciosMasSolicitadosResponse {
  generarReporteServiciosMasSolicitadosPorNegocio: InformePDFResponse;
}

interface ReporteOcupacionEstacionesResponse {
  generarReporteOcupacionEstaciones: InformePDFResponse;
}

interface ReporteIngresosResponse {
  generarReporteIngresos: InformePDFResponse;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesGraphQl {
  constructor(private apollo: Apollo) { }

  /**
   * Genera un reporte PDF de servicios más solicitados del negocio
   */
  generar_reporte_servicios_mas_solicitados_por_negocio(): Observable<InformePDFResponse> {
    return this.apollo.query<ReporteServiciosMasSolicitadosResponse>({
      query: gql`
        query {
          generarReporteServiciosMasSolicitadosPorNegocio {
            success
            pdfBase64
            nombreArchivo
            mensaje
          }
        }
      `,
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data!.generarReporteServiciosMasSolicitadosPorNegocio)
    );
  }

  /**
   * Genera un reporte PDF de ocupación por estación del negocio
   */
  generar_reporte_ocupacion_estaciones(): Observable<InformePDFResponse> {
    return this.apollo.query<ReporteOcupacionEstacionesResponse>({
      query: gql`
        query {
          generarReporteOcupacionEstaciones {
            success
            pdfBase64
            nombreArchivo
            mensaje
          }
        }
      `,
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data!.generarReporteOcupacionEstaciones)
    );
  }

  /**
   * Genera un reporte PDF de ingresos del negocio
   */
  generar_reporte_ingresos(): Observable<InformePDFResponse> {
    return this.apollo.query<ReporteIngresosResponse>({
      query: gql`
        query {
          generarReporteIngresos {
            success
            pdfBase64
            nombreArchivo
            mensaje
          }
        }
      `,
      fetchPolicy: 'network-only'
    }).pipe(
      map(result => result.data!.generarReporteIngresos)
    );
  }
}

