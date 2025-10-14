import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { INegocio } from '../../domain/entities/INegocio';
import { IServicio } from '../../domain/entities/IServicio';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faClock, faMapPin, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Appointment } from '../booking/appointment/appointment';
@Component({
  selector: 'app-business',
  imports: [CommonModule, FontAwesomeModule, Appointment],
  templateUrl: './business.html',
})
export class Business implements OnInit {
  // FontAwesome icons
  faArrowLeft = faArrowLeft;
  faClock = faClock;
  faMapPin = faMapPin;
  faPhone = faPhone;
  faEnvelope = faEnvelope;

  // Component data
  business: INegocio | null = null;
  services: IServicio[] = [];

  constructor(
    private location: Location,
    private route: ActivatedRoute
  ) { }

  mostrarModal: boolean = false;
  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  ngOnInit(): void {
    // TODO: Obtener el ID del negocio de la ruta y cargar los datos
    const businessId = this.route.snapshot.paramMap.get('id');
    this.loadBusinessData(businessId);
  }

  goBack(): void {
    this.location.back();
  }

  loadBusinessData(businessId: string | null): void {
    // TODO: Implementar llamada al servicio para obtener datos del negocio
    // Por ahora, datos de ejemplo
    if (businessId) {
      this.business = {
        id: businessId,
        nombre: 'Negocio de Ejemplo',
        categoria: 'Salud',
        descripcion: 'Descripción del negocio de ejemplo',
        ubicacion: 'Dirección de ejemplo',
        telefono: '+1234567890',
        correo: 'ejemplo@negocio.com',
        imagen_url: '/assets/fila.jpg',
        estado: true,
        horaDeAtencion: [],
        estacion: []
      };

      this.services = [
        {
          id: '1',
          negocio_id: businessId,
          nombre: 'Servicio 1',
          descripcion: 'Descripción del servicio 1',
          duracion_minutos: 30,
          visible: true
        }
      ];
    }
  }

  handleBookService(serviceId: string): void {
    // TODO: Implementar lógica para agendar cita
    console.log('Agendar servicio:', serviceId);
  }
}
