import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { INegocio } from '../../domain/entities/INegocio';
import { IServicio } from '../../domain/entities/IServicio';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faClock, faMapPin, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Appointment } from '../booking/appointment/appointment';
import { NegocioServices } from '../../services/Rest/negocio-services';

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
  isLoading: boolean = false;
  error: string = '';
  servicioModalAbierto: string | null = null;

  constructor(
    private location: Location,
    private route: ActivatedRoute,
    private negocioServices: NegocioServices
  ) { }

  abrirModal(servicioId: string) {
    this.servicioModalAbierto = servicioId;
  }

  cerrarModal() {
    this.servicioModalAbierto = null;
  }

  isModalAbierto(servicioId: string): boolean {
    return this.servicioModalAbierto === servicioId;
  }

  ngOnInit(): void {
    const businessId = this.route.snapshot.paramMap.get('id');
    if (businessId) {
      this.loadBusinessData(businessId);
    }
  }

  goBack(): void {
    localStorage.removeItem('businessId');
    this.location.back();
  }

  loadBusinessData(businessId: string): void {
    this.isLoading = true;
    this.error = '';

    this.negocioServices.getNegocioById(businessId).subscribe({
      next: (data) => {
        this.business = data;
        this.isLoading = false;
        console.log('Negocio cargado:', this.business);
        
        // Cargar servicios del negocio
        this.loadServices(businessId);
      },
      error: (err) => {
        console.error('Error al cargar negocio:', err);
        this.error = 'No se pudo cargar la información del negocio.';
        this.isLoading = false;
      }
    });
  }

  loadServices(businessId: string): void {
    this.negocioServices.getServiciosByNegocio(businessId).subscribe({
      next: (data) => {
        this.services = data;
        console.log('Servicios cargados:', this.services);
      },
      error: (err) => {
        console.error('Error al cargar servicios:', err);
        // No mostramos error general, solo dejamos la lista vacía
        this.services = [];
      }
    });
  }

  handleBookService(serviceId: string): void {
    // TODO: Implementar lógica para agendar cita
    console.log('Agendar servicio:', serviceId);
  }
}
