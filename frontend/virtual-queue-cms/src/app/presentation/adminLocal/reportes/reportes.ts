import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesGraphQl } from '../../../services/GraphQL/reportes-graph-ql';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes {
  tipoReporte = signal<string>('servicios-mas-solicitados');
  isLoading = signal<boolean>(false);
  mensaje = signal<string>('');
  mensajeTipo = signal<'success' | 'error' | ''>('');

  constructor(private reportesGraphQl: ReportesGraphQl) { }

  seleccionarTipoReporte(tipo: string) {
    this.tipoReporte.set(tipo);
  }

  generarReporte() {
    this.isLoading.set(true);
    this.mensaje.set('');
    this.mensajeTipo.set('');

    let reporteObservable;

    switch (this.tipoReporte()) {
      case 'servicios-mas-solicitados':
        reporteObservable = this.reportesGraphQl.generar_reporte_servicios_mas_solicitados_por_negocio();
        break;
      case 'ocupacion-estaciones':
        reporteObservable = this.reportesGraphQl.generar_reporte_ocupacion_estaciones();
        break;
      case 'ingresos':
        reporteObservable = this.reportesGraphQl.generar_reporte_ingresos();
        break;
      default:
        this.mostrarMensaje('Tipo de reporte no válido', 'error');
        this.isLoading.set(false);
        return;
    }

    reporteObservable.subscribe({
      next: (response) => {
        if (response.success) {
          this.descargarPDF(response.pdfBase64, response.nombreArchivo);
          this.mostrarMensaje('Reporte generado exitosamente', 'success');
        } else {
          this.mostrarMensaje(response.mensaje || 'Error al generar el reporte', 'error');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error al generar reporte:', error);
        this.mostrarMensaje('Error al generar el reporte. Por favor, inténtalo de nuevo.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  private descargarPDF(pdfBase64: string, nombreArchivo: string) {
    try {
      // Convertir base64 a Blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo;

      // Simular click para descargar
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      this.mostrarMensaje('Error al descargar el PDF', 'error');
    }
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error') {
    this.mensaje.set(mensaje);
    this.mensajeTipo.set(tipo);
    setTimeout(() => {
      this.mensaje.set('');
      this.mensajeTipo.set('');
    }, 5000);
  }
}
